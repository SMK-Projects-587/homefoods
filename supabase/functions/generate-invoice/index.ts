// generate-invoice — renders and stores the PDF for an order's invoice.
//
// The atomic part (snapshotting the order into a new `invoices` row, FY-
// sequential numbering) happens in the issue_invoice() Postgres function
// (20260720100000_invoice_issuance.sql) — Postgres can't render PDFs, so
// this function calls that RPC first, then renders the PDF from the
// returned row and uploads it via the same STORAGE_DRIVER (local/r2) split
// as r2-presign (see supabase/functions/_shared/storage-driver.ts).
//
//   POST { order_id: number }
//     -> { invoice_id, invoice_number, bucket: "invoices", key, status }
//
// The dashboard fetches the actual PDF afterward via the existing
// r2-presign `action: "download"` endpoint with that key — no changes
// needed there, it already handles the invoices bucket on both drivers.
//
// Retry-safety: invoices.order_id is UNIQUE, so a network blip during the
// PDF upload — after issue_invoice() already burned a real invoice number —
// would otherwise permanently strand that order (every retry would hit the
// unique violation and fail). Instead, on a 23505 from issue_invoice(), this
// function looks up the existing invoice: if it has no pdf_key yet (a
// stuck prior attempt), it resumes from the render/upload step using that
// row's already-assigned number rather than erroring.
//
// Auth: same staff gate as r2-presign — verify_jwt only proves a project
// JWT; auth.getUser() is the real check, and every authenticated user is
// staff per the trust model documented there.

import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  env,
  getDriver,
  localAdmin,
  r2Client,
  r2ObjectUrl,
} from "../_shared/storage-driver.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// PLACEHOLDER business details — replace with the real registered business
// name/address/phone/GSTIN before this goes live. Left blank fields (e.g. no
// GSTIN yet) are simply omitted from the printed header.
// ---------------------------------------------------------------------------
const BUSINESS = {
  name: "HomeFoods (PLACEHOLDER — set real business name)",
  addressLines: ["PLACEHOLDER address line 1", "PLACEHOLDER city, state - PIN, India"],
  phone: "PLACEHOLDER phone",
  gstin: "", // leave blank if not GST-registered; omitted from the PDF when empty
};

type Invoice = {
  id: number;
  order_id: number;
  invoice_number: string;
  status: string;
  issued_at: string | null;
  billing_name: string;
  billing_address: Record<string, string | undefined> | null;
  line_items: Array<{
    product_name: string;
    variant_title: string;
    sku: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  pdf_key: string;
};

// pdf-lib's standard 14 fonts only support WinAnsi (Latin-1-ish) glyphs —
// drawText() throws on anything outside that (e.g. the ₹ sign, or a name
// typed in a regional script), which would otherwise take down invoice
// generation entirely for an otherwise valid order. Strip to a safe subset
// instead of crashing.
function safeText(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, "?");
}

function money(n: number): string {
  return `Rs. ${n.toFixed(2)}`;
}

function formatAddress(addr: Invoice["billing_address"]): string[] {
  if (!addr) return [];
  const { line1, line2, city, state, postal_code, country } = addr;
  return [line1, line2, [city, state, postal_code].filter(Boolean).join(", "), country]
    .filter((l): l is string => !!l && l.trim() !== "");
}

async function renderInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 in points
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  const marginX = 48;
  const pageWidth = 595.28;
  let y = 800;

  const draw = (
    text: string,
    x: number,
    opts: { size?: number; f?: typeof font; color?: typeof black } = {},
  ) => {
    page.drawText(safeText(text), {
      x,
      y,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: opts.color ?? black,
    });
  };

  // ---- header ----
  draw("TAX INVOICE", marginX, { size: 18, f: bold });
  y -= 22;
  draw(BUSINESS.name, marginX, { size: 10, f: bold });
  for (const line of BUSINESS.addressLines) {
    y -= 13;
    draw(line, marginX, { size: 9, color: gray });
  }
  if (BUSINESS.phone) {
    y -= 13;
    draw(`Phone: ${BUSINESS.phone}`, marginX, { size: 9, color: gray });
  }
  if (BUSINESS.gstin) {
    y -= 13;
    draw(`GSTIN: ${BUSINESS.gstin}`, marginX, { size: 9, color: gray });
  }

  // ---- invoice meta ----
  // Both labels drawn at the same y (before it's decremented) so they land
  // on one line — draw() always reads the current cursor, so two logically
  // "columned" pieces of text only align if nothing moves y between them.
  y -= 20;
  const issuedDate = invoice.issued_at
    ? new Date(invoice.issued_at).toISOString().slice(0, 10)
    : "";
  draw("Invoice #:", marginX, { size: 9, f: bold, color: gray });
  draw(invoice.invoice_number, marginX + 55, { size: 9 });
  draw("Date:", marginX + 220, { size: 9, f: bold, color: gray });
  draw(issuedDate, marginX + 260, { size: 9 });

  y -= 24;

  // ---- bill to ----
  draw("BILL TO", marginX, { size: 9, f: bold, color: gray });
  y -= 14;
  draw(invoice.billing_name, marginX, { size: 10 });
  for (const line of formatAddress(invoice.billing_address)) {
    y -= 13;
    draw(line, marginX, { size: 9, color: gray });
  }

  y -= 28;

  // ---- line items table ----
  const cols = {
    product: marginX,
    qty: 360,
    unit: 420,
    total: 500,
  };
  draw("Product", cols.product, { size: 9, f: bold });
  draw("Qty", cols.qty, { size: 9, f: bold });
  draw("Unit price", cols.unit, { size: 9, f: bold });
  draw("Line total", cols.total, { size: 9, f: bold });
  y -= 6;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 16;

  for (const item of invoice.line_items) {
    const label = `${item.product_name} (${item.variant_title})`;
    draw(label, cols.product, { size: 9 });
    draw(String(item.quantity), cols.qty, { size: 9 });
    draw(money(item.unit_price), cols.unit, { size: 9 });
    draw(money(item.line_total), cols.total, { size: 9 });
    y -= 12;
    draw(`SKU: ${item.sku}`, cols.product, { size: 7.5, color: gray });
    y -= 18;
  }

  y -= 8;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 20;

  // ---- totals ----
  // Shipping/other charges is deliberately derived from the invoice's own
  // frozen columns only (never re-read from the live order), so it stays
  // self-consistent with the printed total forever, independent of any
  // later edits to the order.
  const shippingOrOther = invoice.total - invoice.subtotal + invoice.discount - invoice.tax;
  const totalsX = 420;
  const rows: { label: string; value: number; isTotal?: boolean }[] = [
    { label: "Subtotal", value: invoice.subtotal },
    { label: "Discount", value: -invoice.discount },
    { label: "Tax", value: invoice.tax },
  ];
  if (Math.abs(shippingOrOther) > 0.004) {
    rows.push({ label: "Shipping / other charges", value: shippingOrOther });
  }
  rows.push({ label: "Total", value: invoice.total, isTotal: true });

  for (const { label, value, isTotal } of rows) {
    draw(label, totalsX, { size: isTotal ? 10 : 9, f: isTotal ? bold : font });
    draw(money(value), totalsX + 90, { size: isTotal ? 10 : 9, f: isTotal ? bold : font });
    y -= isTotal ? 16 : 13;
  }

  y -= 30;
  draw("This is a computer-generated invoice.", marginX, { size: 8, color: gray });

  return await doc.save();
}

function invoiceObjectKey(invoiceNumber: string): string {
  return `${invoiceNumber.toLowerCase().replace(/\//g, "-")}.pdf`;
}

async function uploadInvoicePdf(key: string, bytes: Uint8Array): Promise<void> {
  const driver = getDriver();
  if (driver === "local") {
    const { error } = await localAdmin().storage.from("invoices").upload(key, bytes, {
      contentType: "application/pdf",
      upsert: true, // safe to overwrite on a retry — same invoice, same bytes
    });
    if (error) throw new Error(`local storage upload failed: ${error.message}`);
    return;
  }
  const res = await r2Client().fetch(r2ObjectUrl("invoices", key).toString(), {
    method: "PUT",
    body: bytes,
    headers: { "Content-Type": "application/pdf" },
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "POST only" });
  }

  // ---- staff gate ----
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return json(401, { error: "staff sign-in required" });
  }

  // ---- input ----
  let body: { order_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid JSON body" });
  }
  const orderId = body.order_id;
  if (typeof orderId !== "number" || !Number.isInteger(orderId) || orderId <= 0) {
    return json(400, { error: "order_id must be a positive integer" });
  }

  // ---- issue (or resume) the invoice row ----
  let invoice: Invoice | null = null;
  {
    const { data, error } = await supabase.rpc("issue_invoice", { p_order_id: orderId });
    if (error) {
      if (error.code === "23505") {
        const { data: existing, error: fetchError } = await supabase
          .from("invoices")
          .select(
            "id, order_id, invoice_number, status, issued_at, billing_name, billing_address, line_items, subtotal, discount, tax, total, pdf_key",
          )
          .eq("order_id", orderId)
          .single();
        if (fetchError || !existing) {
          return json(500, { error: "invoice exists but could not be re-fetched" });
        }
        if (existing.pdf_key) {
          return json(409, {
            error: "invoice already issued for this order",
            invoice_number: existing.invoice_number,
            bucket: "invoices",
            key: existing.pdf_key,
          });
        }
        // Stuck prior attempt (number burned, PDF never uploaded) — resume.
        invoice = existing as Invoice;
      } else if (error.message.includes("not found")) {
        return json(404, { error: error.message });
      } else if (error.message.includes("must be confirmed or completed")) {
        return json(400, { error: error.message });
      } else {
        return json(500, { error: error.message });
      }
    } else {
      invoice = data as Invoice;
    }
  }
  if (!invoice) return json(500, { error: "unreachable: no invoice resolved" });

  // ---- render + upload the PDF, then attach pdf_key ----
  try {
    const key = invoiceObjectKey(invoice.invoice_number);
    const pdfBytes = await renderInvoicePdf(invoice);
    await uploadInvoicePdf(key, pdfBytes);

    const { error: attachError } = await supabase
      .from("invoices")
      .update({ pdf_key: key })
      .eq("id", invoice.id);
    if (attachError) throw new Error(`attaching pdf_key failed: ${attachError.message}`);

    return json(200, {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      bucket: "invoices",
      key,
      status: "issued",
    });
  } catch (err) {
    // The invoices row already exists at this point (issued, no pdf_key) —
    // a retried call will resume from here via the 23505 branch above.
    return json(502, {
      error: err instanceof Error ? err.message : "invoice PDF generation failed",
      invoice_number: invoice.invoice_number,
    });
  }
});
