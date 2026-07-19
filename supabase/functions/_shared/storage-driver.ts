// Shared STORAGE_DRIVER plumbing for every edge function that touches object
// storage (currently r2-presign and generate-invoice). Both drivers are
// documented in r2-presign/index.ts's header comment; this module only holds
// the bits that would otherwise be duplicated between functions and drift.

import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

export type StorageDriver = "local" | "r2";
export type Bucket = "images" | "invoices";

export function getDriver(): StorageDriver {
  const driver = env("STORAGE_DRIVER");
  if (driver !== "local" && driver !== "r2") {
    throw new Error(`unknown STORAGE_DRIVER: "${driver}"`);
  }
  return driver;
}

// ---- local driver: Supabase Storage ----

export function localAdmin() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
}

// SUPABASE_URL inside the edge runtime is the internal Docker network
// address (http://kong:8000) — right for server-to-server calls, but
// useless as a URL handed back to a browser or curl on the host. Swap in
// the host-reachable origin for anything returned to the caller.
export function toPublicUrl(url: string): string {
  const u = new URL(url);
  return `${env("LOCAL_PUBLIC_URL")}${u.pathname}${u.search}`;
}

// ---- r2 driver: Cloudflare R2 (production) ----

export function r2Client(): AwsClient {
  return new AwsClient({
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    service: "s3",
    region: "auto",
  });
}

export function r2ObjectUrl(bucket: Bucket, key: string): URL {
  const buckets: Record<Bucket, string> = {
    images: env("R2_BUCKET_IMAGES"),
    invoices: env("R2_BUCKET_INVOICES"),
  };
  return new URL(`${env("R2_S3_ENDPOINT")}/${buckets[bucket]}/${key}`);
}
