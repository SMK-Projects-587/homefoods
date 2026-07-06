// r2-presign — the only server-side code in the system.
//
// The React dashboard cannot hold R2 credentials (anything shipped to the
// browser is public), so this staff-only function brokers access to the two
// Cloudflare R2 buckets:
//
//   POST { action: "upload",   bucket: "images"|"invoices", key }
//     -> { url, method: "PUT", bucket, key, expires_in }
//        (the client then PUTs the file bytes directly to R2)
//   POST { action: "download", bucket, key }
//     -> { url, method: "GET", bucket, key, expires_in }
//        (presigned GET — needed for the private invoices bucket, and for
//         images until the public custom domain exists)
//   POST { action: "delete",   bucket, key }
//     -> { ok: true }   (performed server-side; nothing is signed)
//
// Auth: verify_jwt in config.toml only proves the caller holds a project JWT
// (the anon key passes it). The real gate is auth.getUser() below — it only
// succeeds for a real signed-in user, and per the trust model every
// authenticated user is staff, so no further role checks are needed.
//
// Secrets (supabase/functions/.env locally, `supabase secrets set` hosted):
// R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_S3_ENDPOINT,
// R2_BUCKET_IMAGES, R2_BUCKET_INVOICES.

import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

const EXPIRES_SECONDS = 600;

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

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

// Object keys are built by the dashboard (e.g. products/<slug>/<uuid>.webp).
// Reject anything that could escape or surprise: traversal, leading slashes,
// exotic characters. Image keys must also live under a known prefix so the
// bucket stays organized.
const KEY_PATTERN = /^[a-z0-9][a-zA-Z0-9/_.-]{1,200}$/;
const IMAGE_PREFIXES = ["products/", "categories/"];

function validateKey(bucket: string, key: string): string | null {
  if (!KEY_PATTERN.test(key) || key.includes("..") || key.includes("//")) {
    return "invalid key";
  }
  if (bucket === "images" && !IMAGE_PREFIXES.some((p) => key.startsWith(p))) {
    return `image keys must start with one of: ${IMAGE_PREFIXES.join(", ")}`;
  }
  return null;
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
  let body: { action?: string; bucket?: string; key?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid JSON body" });
  }
  const { action, bucket, key } = body;

  // Validate all input before touching secrets, so bad requests get a real
  // 400 even when the R2 env is missing/misconfigured.
  if (bucket !== "images" && bucket !== "invoices") {
    return json(400, { error: 'bucket must be "images" or "invoices"' });
  }
  if (!key) return json(400, { error: "key is required" });
  const keyError = validateKey(bucket, key);
  if (keyError) return json(400, { error: keyError });

  const buckets: Record<string, string> = {
    images: env("R2_BUCKET_IMAGES"),
    invoices: env("R2_BUCKET_INVOICES"),
  };

  const r2 = new AwsClient({
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    service: "s3",
    region: "auto",
  });
  const objectUrl = new URL(
    `${env("R2_S3_ENDPOINT")}/${buckets[bucket]}/${key}`,
  );

  switch (action) {
    case "upload":
    case "download": {
      const method = action === "upload" ? "PUT" : "GET";
      objectUrl.searchParams.set("X-Amz-Expires", String(EXPIRES_SECONDS));
      const signed = await r2.sign(new Request(objectUrl, { method }), {
        aws: { signQuery: true },
      });
      return json(200, {
        url: signed.url,
        method,
        bucket,
        key,
        expires_in: EXPIRES_SECONDS,
      });
    }
    case "delete": {
      const res = await r2.fetch(objectUrl.toString(), { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        return json(502, { error: `R2 delete failed: ${res.status}` });
      }
      return json(200, { ok: true });
    }
    default:
      return json(400, {
        error: 'action must be "upload", "download" or "delete"',
      });
  }
});
