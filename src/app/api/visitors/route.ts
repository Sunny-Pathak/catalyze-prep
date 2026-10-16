import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let lastHitTimestamp = 0;

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const requestedHit = url.searchParams.get("hit") !== "false";

  // Prevent double-counting within 1.5 seconds (e.g. StrictMode, double fetch, rapid retry)
  const now = Date.now();
  const shouldHit = requestedHit && now - lastHitTimestamp > 1500;

  if (shouldHit) {
    lastHitTimestamp = now;
  }

  const endpoint = shouldHit
    ? "https://abacus.jasoncameron.dev/hit/catalyze-prep-live/visits"
    : "https://abacus.jasoncameron.dev/get/catalyze-prep-live/visits";

  try {
    const cloudRes = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });

    if (cloudRes.ok) {
      const cloudData = await cloudRes.json();
      const hits = Number(cloudData?.value);
      if (!isNaN(hits)) {
        return NextResponse.json({ count: hits });
      }
    } else if (cloudRes.status === 404) {
      return NextResponse.json({ count: 0 });
    }
  } catch (err) {
    console.error("Cloud visitor counter fetch error:", err);
  }

  return NextResponse.json({ count: null }, { status: 500 });
}

