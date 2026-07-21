import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social-share card, rendered on the fly so every page has a preview
// even before product photography exists. Latin-only (ImageResponse default
// font has no Telugu glyphs).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f5ead8",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "#c67139",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f5ead8",
              fontSize: 34,
            }}
          >
            🌿
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#201e1d" }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              color: "#201e1d",
              letterSpacing: "-0.02em",
              maxWidth: 900,
            }}
          >
            Amma&rsquo;s kitchen, shipped to your door.
          </div>
          <div style={{ fontSize: 30, color: "#8c491a" }}>
            Andhra pickles · podis · snacks · sweets — since 1992
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          {["100% Pure Veg", "No preservatives", "Ships all over India"].map(
            (t) => (
              <div
                key={t}
                style={{
                  fontSize: 24,
                  color: "#56633f",
                  background: "#e1eecc",
                  padding: "10px 22px",
                  borderRadius: 999,
                }}
              >
                {t}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
