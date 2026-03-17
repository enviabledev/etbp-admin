"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (
      error.message?.includes("Failed to find Server Action") ||
      error.message?.includes("older or newer deployment") ||
      error.message?.includes("ChunkLoadError")
    ) {
      window.location.reload();
      return;
    }
  }, [error]);

  return (
    <html>
      <body style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        margin: 0,
        padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#64748B", marginBottom: "1.5rem" }}>
            We encountered an unexpected error. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#0057FF",
              color: "white",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
