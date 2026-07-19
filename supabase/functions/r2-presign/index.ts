// r2-presign — the only server-side code in the system.
//
// The React dashboard cannot hold storage credentials (anything shipped to
// the browser is public), so this staff-only function brokers access to the
// two object buckets (images, invoices) via one of two STORAGE_DRIVERs:
//
//   "local" — Supabase Storage running in the local stack (buckets declared
//             in supabase/config.toml). Uses SUPABASE_URL /
//             SUPABASE_SERVICE_ROLE_KEY, which every function gets for
//             free — no Cloudflare setup needed to develop locally.
//   "r2"    — Cloudflare R2 (production). See TODO.md for the remaining
//             setup (buckets, API token, `supabase secrets set`, custom
//             domain).
//
//   POST { action: "upload",   bucket: "images"|"invoices", key }
//     -> { url, method: "PUT", bucket, key, expires_in }
//        (the client then PUTs the file bytes directly to storage)
//   POST { action: "download", bucket, key }
//     -> { url, method: "GET", bucket, key, expires_in }
//        (signed GET for the private invoices bucket; for the public
//         images bucket this returns a plain, unsigned URL instead — no
//         auth needed to read it, only to ask for it here)
//   POST { action: "delete",   bucket, key }
//     -> { ok: true }   (performed server-side; nothing is signed)
//
// Auth: verify_jwt in config.toml only proves the caller holds a project JWT
// (the anon key passes it). The real gate is auth.getUser() below — it only
// succeeds for a real signed-in user, and per the trust model every
// authenticated user is staff, so no further role checks are needed.
//
// Secrets:
//   STORAGE_DRIVER=local|r2, LOCAL_PUBLIC_URL (only read when
//     STORAGE_DRIVER=local — the host-reachable API URL, since
//     SUPABASE_URL inside the function is the internal Docker address) —
//     both written to supabase/functions/.env locally by
//     scripts/sync-function-env.sh; STORAGE_DRIVER=r2 is set via `supabase
//     secrets set` on the hosted project (TODO.md), which never runs the
//     local driver so has no need for LOCAL_PUBLIC_URL.
//   R2_* (only read when STORAGE_DRIVER=r2): R2_ACCESS_KEY_ID,
//     R2_SECRET_ACCESS_KEY, R2_S3_ENDPOINT, R2_BUCKET_IMAGES,
//     R2_BUCKET_INVOICES.

import { createClient } from "@supabase/supabase-js";
import {
  env,
  getDriver,
  localAdmin,
  r2Client,
  r2ObjectUrl,
  toPublicUrl,
  type Bucket,
} from "../_shared/storage-driver.ts";

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

// Object keys are built by the dashboard (e.g. products/<slug>/<uuid>.webp).
// Reject anything that could escape or surprise: traversal, leading slashes,
// exotic characters. Image keys must also live under a known prefix so the
// bucket stays organized.
const KEY_PATTERN = /^[a-z0-9][a-zA-Z0-9/_.-]{1,200}$/;
const IMAGE_PREFIXES = ["products/", "categories/"];

function isBucket(bucket: string): bucket is Bucket {
  return bucket === "images" || bucket === "invoices";
}

function validateKey(bucket: string, key: string): string | null {
  if (!KEY_PATTERN.test(key) || key.includes("..") || key.includes("//")) {
    return "invalid key";
  }
  if (bucket === "images" && !IMAGE_PREFIXES.some((p) => key.startsWith(p))) {
    return `image keys must start with one of: ${IMAGE_PREFIXES.join(", ")}`;
  }
  return null;
}

type SignAction = "upload" | "download";
type SignResult = {
  url: string;
  method: "PUT" | "GET";
  expires_in: number | null;
};

// ---- local driver: Supabase Storage ----

async function signLocal(
  action: SignAction,
  bucket: Bucket,
  key: string,
): Promise<SignResult> {
  const store = localAdmin().storage.from(bucket);

  if (action === "download" && bucket === "images") {
    const { data } = store.getPublicUrl(key);
    return { url: toPublicUrl(data.publicUrl), method: "GET", expires_in: null };
  }

  if (action === "upload") {
    const { data, error } = await store.createSignedUploadUrl(key);
    if (error) throw new Error(`local storage sign failed: ${error.message}`);
    return {
      url: toPublicUrl(data.signedUrl),
      method: "PUT",
      expires_in: EXPIRES_SECONDS,
    };
  }

  const { data, error } = await store.createSignedUrl(key, EXPIRES_SECONDS);
  if (error) throw new Error(`local storage sign failed: ${error.message}`);
  return {
    url: toPublicUrl(data.signedUrl),
    method: "GET",
    expires_in: EXPIRES_SECONDS,
  };
}

async function deleteLocal(bucket: Bucket, key: string): Promise<void> {
  const { error } = await localAdmin().storage.from(bucket).remove([key]);
  if (error) throw new Error(`local storage delete failed: ${error.message}`);
}

// ---- r2 driver: Cloudflare R2 (production) ----

async function signR2(
  action: SignAction,
  bucket: Bucket,
  key: string,
): Promise<SignResult> {
  const method = action === "upload" ? "PUT" : "GET";
  const objectUrl = r2ObjectUrl(bucket, key);
  objectUrl.searchParams.set("X-Amz-Expires", String(EXPIRES_SECONDS));
  const signed = await r2Client().sign(new Request(objectUrl, { method }), {
    aws: { signQuery: true },
  });
  return { url: signed.url, method, expires_in: EXPIRES_SECONDS };
}

async function deleteR2(bucket: Bucket, key: string): Promise<void> {
  const res = await r2Client().fetch(r2ObjectUrl(bucket, key).toString(), {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`R2 delete failed: ${res.status}`);
  }
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
  if (!bucket || !isBucket(bucket)) {
    return json(400, { error: 'bucket must be "images" or "invoices"' });
  }
  if (!key) return json(400, { error: "key is required" });
  const keyError = validateKey(bucket, key);
  if (keyError) return json(400, { error: keyError });

  let driver;
  try {
    driver = getDriver();
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "bad STORAGE_DRIVER" });
  }

  try {
    switch (action) {
      case "upload":
      case "download": {
        const result = driver === "local"
          ? await signLocal(action, bucket, key)
          : await signR2(action, bucket, key);
        return json(200, { ...result, bucket, key });
      }
      case "delete": {
        if (driver === "local") await deleteLocal(bucket, key);
        else await deleteR2(bucket, key);
        return json(200, { ok: true });
      }
      default:
        return json(400, {
          error: 'action must be "upload", "download" or "delete"',
        });
    }
  } catch (err) {
    return json(502, {
      error: err instanceof Error ? err.message : "storage operation failed",
    });
  }
});
