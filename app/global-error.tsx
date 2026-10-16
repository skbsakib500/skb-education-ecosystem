"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <div style={{ fontSize: 56 }}>⚠️</div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
                marginTop: 16,
              }}
            >
              Critical error
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
              অ্যাপটি লোড হয়নি। অনুগ্রহ করে page reload করুন।
            </p>
            {error.digest && (
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 11,
                  fontFamily: "monospace",
                  marginTop: 12,
                }}
              >
                ref: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                marginTop: 20,
                padding: "10px 20px",
                borderRadius: 8,
                background: "#0f172a",
                color: "white",
                border: 0,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
