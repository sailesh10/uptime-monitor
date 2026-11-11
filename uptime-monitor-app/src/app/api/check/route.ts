import { NextRequest, NextResponse } from "next/server";

// Temporary allowlist for our MVP.
// We'll support arbitrary public websites later.
const ALLOWED_HOSTNAMES = new Set([
  "google.com",
  "www.google.com",
  "github.com",
  "www.github.com",
  "example.com",
]);

export async function POST(request: NextRequest) {
  let url: string;

  try {
    const body = await request.json();
    url = body.url;

    if (typeof url !== "string") {
      return NextResponse.json({ error: "A URL is required" }, { status: 400 });
    }

    const parsed = new URL(url);

    if (
      parsed.protocol !== "https:" ||
      !ALLOWED_HOSTNAMES.has(parsed.hostname) ||
      parsed.port !== "" ||
      parsed.username ||
      parsed.password
    ) {
      return NextResponse.json(
        { error: "URL is not allowed" },
        { status: 400 }
      );
    }

    // Canonicalize the URL to its origin.
    // This avoids requesting user-supplied paths.
    url = parsed.origin;
  } catch {
    return NextResponse.json(
      { error: "Invalid request or URL" },
      { status: 400 }
    );
  }

  const start = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Math.round(performance.now() - start);

    const isUp = response.status >= 200 && response.status < 400;

    return NextResponse.json({
      status: isUp ? "up" : "down",
      responseTime,
      statusCode: response.status,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: "down",
      responseTime: null,
      statusCode: null,
      checkedAt: new Date().toISOString(),
    });
  }
}
