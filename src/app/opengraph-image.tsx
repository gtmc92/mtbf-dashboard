import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "설비 신뢰성 관리 & 분석 플랫폼";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OgImage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://mtbf-dashboard.vercel.app";

  const notoSansKrBold = await fetch(
    "https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5CgmOsn7uwpYcuH8y.woff2"
  ).then((res) => res.arrayBuffer());

  const logoData = await fetch(`${siteUrl}/ci-img-1.png`).then((res) =>
    res.arrayBuffer()
  );
  const logoBase64 = `data:image/png;base64,${Buffer.from(logoData).toString("base64")}`;

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
          fontFamily: "'Noto Sans KR'",
          color: "#ffffff",
          padding: "60px",
          gap: "24px",
        }}
      >
        <img
          src={logoBase64}
          width={180}
          height={60}
          style={{ objectFit: "contain" }}
        />
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
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans KR",
          data: notoSansKrBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
