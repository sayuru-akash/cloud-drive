import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "radial-gradient(circle at top left, rgba(25,122,104,0.22), transparent 34%), linear-gradient(180deg, #f7f4ee 0%, #f4efe6 100%)",
          color: "#111827",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.04em",
          }}
        >
          <div
            style={{
              height: "22px",
              width: "22px",
              borderRadius: "999px",
              background: "#197a68",
            }}
          />
          Cloud Drive
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              maxWidth: "900px",
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.08em",
            }}
          >
            Internal file operations with cleaner control.
          </div>
          <div
            style={{
              maxWidth: "760px",
              fontSize: 32,
              lineHeight: 1.45,
              color: "#445063",
            }}
          >
            {siteConfig.description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "#5f6877",
          }}
        >
          <div>Next.js 16 foundation</div>
          <div>{siteConfig.url.replace("https://", "").replace("http://", "")}</div>
        </div>
      </div>
    ),
    size,
  );
}
