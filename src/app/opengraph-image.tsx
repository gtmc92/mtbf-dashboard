import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "설비 신뢰성 관리 & 분석 플랫폼";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          fontFamily: "sans-serif",
          color: "#ffffff",
          padding: "60px",
          gap: "24px",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#94a3b8",
          }}
        >
          DEERFOS
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          설비 신뢰성 관리 &amp; 분석 플랫폼
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#7dd3fc",
            letterSpacing: "0.1em",
          }}
        >
          MTBF / MTTR Dashboard
        </div>
      </div>
    ),
    { ...size }
  );
}
