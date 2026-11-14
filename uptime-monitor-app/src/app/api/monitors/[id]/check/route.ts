import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_HOSTNAMES = new Set([
  "google.com",
  "www.google.com",
  "github.com",
  "www.github.com",
  "example.com",
]);

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const monitor = await prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    const url = new URL(monitor.url);

    if (
      url.protocol !== "https:" ||
      !ALLOWED_HOSTNAMES.has(url.hostname) ||
      url.port !== "" ||
      url.username ||
      url.password
    ) {
      return NextResponse.json(
        { error: "Monitor URL is not allowed" },
        { status: 400 }
      );
    }

    const start = performance.now();

    let status = "down";
    let statusCode: number | null = null;
    let responseTime: number | null = null;

    try {
      const response = await fetch(url.origin, {
        method: "GET",
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
      });

      statusCode = response.status;
      responseTime = Math.round(performance.now() - start);

      if (response.status >= 200 && response.status < 400) {
        status = "up";
      }
    } catch (error) {
      console.error("Health check failed:", error);
    }

    const healthCheck = await prisma.healthCheck.create({
      data: {
        monitorId: monitor.id,
        status,
        statusCode,
        responseTime,
      },
    });

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error("Monitor check error:", error);

    return NextResponse.json(
      { error: "Failed to check monitor" },
      { status: 500 }
    );
  }
}
