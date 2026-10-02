import { ImageResponse } from "next/og";

const SIZES = new Set([180, 192, 512]);

export async function GET(_req: Request, ctx: RouteContext<"/icons/[size]">) {
  const size = Number((await ctx.params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f7d4f",
          fontSize: size * 0.6,
        }}
      >
        🍱
      </div>
    ),
    { width: size, height: size, emoji: "twemoji" },
  );
}
