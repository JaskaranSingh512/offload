import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const heading = searchParams.get("heading") ?? "";
  const body    = searchParams.get("body")    ?? "";
  const slide   = parseInt(searchParams.get("slide") ?? "1", 10);
  const total   = parseInt(searchParams.get("total") ?? "1", 10);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          />
          <span style={{ color: "#ffffff80", fontSize: 28, letterSpacing: 2 }}>
            OFFLOAD
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ color: "#ffffff40", fontSize: 24 }}>
            {slide}/{total}
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          <div
            style={{
              width: 60,
              height: 4,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              borderRadius: 2,
            }}
          />
          <h1
            style={{
              fontSize: heading.length > 40 ? 72 : 88,
              fontWeight: 900,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "-2px",
            }}
          >
            {heading}
          </h1>
          <p
            style={{
              fontSize: 36,
              color: "#ffffffb0",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: "85%",
            }}
          >
            {body}
          </p>
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#ffffff30", fontSize: 22 }}>
            offload.so
          </span>
          <div
            style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 40,
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Swipe →
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
