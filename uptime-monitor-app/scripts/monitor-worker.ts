import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHECK_INTERVAL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 10_000;

// Same temporary allowlist as our API.
// Arbitrary URL monitoring requires stronger SSRF protection.
const ALLOWED_HOSTNAMES = new Set([
  "google.com",
  "www.google.com",
  "github.com",
  "www.github.com",
  "example.com",
]);

function getSafeUrl(value: string): string {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    !ALLOWED_HOSTNAMES.has(url.hostname) ||
    url.port !== "" ||
    url.username ||
    url.password
  ) {
    throw new Error("Monitor URL is not allowed");
  }

  return url.origin;
}

async function checkWebsite(monitor: {
  id: string;
  name: string;
  url: string;
}) {
  console.log(`Checking ${monitor.name}...`);

  let status = "down";
  let statusCode: number | null = null;
  let responseTime: number | null = null;

  try {
    const safeUrl = getSafeUrl(monitor.url);
    const start = performance.now();

    const response = await fetch(safeUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    responseTime = Math.round(performance.now() - start);
    statusCode = response.status;

    if (response.status >= 200 && response.status < 400) {
      status = "up";
    }
  } catch (error) {
    console.error(`Check failed for ${monitor.name}:`, error);
  }

  await prisma.healthCheck.create({
    data: {
      monitorId: monitor.id,
      status,
      statusCode,
      responseTime,
    },
  });

  console.log(
    `${monitor.name}: ${status.toUpperCase()} | ` +
      `${responseTime ?? "N/A"}ms | ` +
      `HTTP ${statusCode ?? "N/A"}`
  );
}

async function runChecks() {
  console.log(`\nStarting monitoring cycle: ${new Date().toISOString()}`);

  const monitors = await prisma.monitor.findMany();

  console.log(`Found ${monitors.length} monitors`);

  // Sequential checks keep this first version simple.
  // We'll add bounded concurrency as the project grows.
  for (const monitor of monitors) {
    try {
      await checkWebsite(monitor);
    } catch (error) {
      console.error(`Unable to save check for ${monitor.name}:`, error);
    }
  }

  console.log("Monitoring cycle completed.\n");
}

let running = true;

async function startWorker() {
  console.log("Uptime Monitor Worker started!");
  console.log("Checking websites every 5 minutes.");

  while (running) {
    try {
      await runChecks();
    } catch (error) {
      console.error("Monitoring cycle failed:", error);
    }

    if (!running) break;

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, CHECK_INTERVAL);

      // Allow Ctrl+C to interrupt the waiting period.
      const stop = () => {
        clearTimeout(timer);
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
        resolve();
      };

      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
    });
  }
}

process.on("SIGINT", () => {
  running = false;
});

process.on("SIGTERM", () => {
  running = false;
});

startWorker()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Worker stopped.");
  });
