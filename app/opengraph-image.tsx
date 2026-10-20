import { ImageResponse } from "next/og";
export const alt = "MB International Traders — Components for manufacturers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#f6f5f0",
          color: "#202722",
          padding: "65px 70px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "75%",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 1 }}>
            MB INTERNATIONAL TRADERS
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: -5,
              lineHeight: 1.03,
            }}
          >
            <span>Small parts.</span>
            <span>Big possibilities.</span>
          </div>
          <div style={{ display: "flex", fontSize: 21, color: "#53624e" }}>
            C3M · Components for manufacturers.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 50,
            top: 190,
            width: 220,
            height: 220,
            border: "33px solid #42584c",
            borderRadius: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 94,
              height: 94,
              border: "20px solid #a4b49b",
              borderRadius: 100,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 65,
            right: 70,
            fontSize: 17,
            display: "flex",
            color: "#244fd8",
          }}
        >
          Gujranwala, Pakistan
        </div>
      </div>
    ),
    size,
  );
}
