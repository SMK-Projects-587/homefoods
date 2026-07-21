// Renders a JSON-LD structured-data block. Server-safe; the payload is
// serialised once and injected as a script tag search engines parse.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here — no user-controlled </script> risk
      // in our catalog fields, and we escape the closing-tag sequence defensively.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
