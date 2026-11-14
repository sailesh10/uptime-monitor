import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const monitors = await prisma.monitor.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        healthChecks: {
          orderBy: {
            checkedAt: "desc",
          },
        },
      },
    });

    const formattedMonitors = monitors.map((monitor) => {
      const checks = monitor.healthChecks;
      const latestCheck = checks[0];

      const successfulChecks = checks.filter(
        (check) => check.status === "up"
      ).length;

      const uptime =
        checks.length > 0
          ? Number(((successfulChecks / checks.length) * 100).toFixed(2))
          : null;

      return {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        status: latestCheck?.status ?? "pending",
        uptime,
        responseTime: latestCheck?.responseTime ?? null,
        statusCode: latestCheck?.statusCode ?? null,
        lastChecked: latestCheck?.checkedAt ?? null,
      };
    });

    return NextResponse.json(formattedMonitors);
  } catch (error) {
    console.error("Failed to fetch monitors:", error);

    return NextResponse.json(
      { error: "Failed to fetch monitors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body?.name;
    const url = body?.url;

    if (typeof name !== "string" || !name.trim() || typeof url !== "string") {
      return NextResponse.json(
        { error: "Valid name and URL are required" },
        { status: 400 }
      );
    }

    const parsed = new URL(url);

    const allowedHosts = new Set([
      "google.com",
      "www.google.com",
      "github.com",
      "www.github.com",
      "example.com",
    ]);

    if (
      parsed.protocol !== "https:" ||
      !allowedHosts.has(parsed.hostname) ||
      parsed.port ||
      parsed.username ||
      parsed.password
    ) {
      return NextResponse.json(
        { error: "URL is not supported yet" },
        { status: 400 }
      );
    }

    const monitor = await prisma.monitor.create({
      data: {
        name: name.trim(),
        url: parsed.origin,
      },
    });

    return NextResponse.json(monitor, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create monitor" },
      { status: 500 }
    );
  }
}
