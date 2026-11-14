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
          take: 1,
        },
      },
    });

    return NextResponse.json(monitors);
  } catch {
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
