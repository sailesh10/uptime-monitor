import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const monitor = await prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    const now = new Date();

    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const checks = await prisma.healthCheck.findMany({
      where: {
        monitorId: id,
        checkedAt: {
          gte: last7Days,
        },
      },
      orderBy: {
        checkedAt: "asc",
      },
      select: {
        id: true,
        status: true,
        statusCode: true,
        responseTime: true,
        checkedAt: true,
      },
    });

    const checks24h = checks.filter((check) => check.checkedAt >= last24Hours);

    function calculateUptime(records: typeof checks): number | null {
      if (records.length === 0) return null;

      const successful = records.filter(
        (check) => check.status === "up"
      ).length;

      return Number(((successful / records.length) * 100).toFixed(2));
    }

    const successfulResponseTimes = checks
      .filter((check) => check.status === "up" && check.responseTime !== null)
      .map((check) => check.responseTime as number);

    const averageResponseTime =
      successfulResponseTimes.length > 0
        ? Math.round(
            successfulResponseTimes.reduce((sum, time) => sum + time, 0) /
              successfulResponseTimes.length
          )
        : null;

    return NextResponse.json({
      monitor,
      stats: {
        uptime24h: calculateUptime(checks24h),
        uptime7d: calculateUptime(checks),
        averageResponseTime,
        totalChecks: checks.length,
      },
      checks,
    });
  } catch (error) {
    console.error("History API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch monitor history" },
      { status: 500 }
    );
  }
}
