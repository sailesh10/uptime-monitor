
"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import ResponseTimeChart from "@/components/ResponseTimeChart";

interface HealthCheck {
  id: string;
  status: string;
  statusCode: number | null;
  responseTime: number | null;
  checkedAt: string;
}

interface HistoryResponse {
  monitor: {
    id: string;
    name: string;
    url: string;
  };
  stats: {
    uptime24h: number | null;
    uptime7d: number | null;
    averageResponseTime: number | null;
    totalChecks: number;
  };
  checks: HealthCheck[];
}

type PageProps = {
  params: Promise<{ id: string }>;
};

// Main page wrapped in Suspense
export default function MonitorDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<MonitorLoading />}>
      <MonitorDetailsContent params={params} />
    </Suspense>
  );
}

// Loading fallback for Suspense
function MonitorLoading() {
  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">
      <p className="text-slate-400">
        Loading monitor details...
      </p>
    </main>
  );
}

// Actual monitor details content
function MonitorDetailsContent({ params }: PageProps) {
  const { id } = use(params);

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const response = await fetch(
          `/api/monitors/${id}/history`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load monitor history");
        }

        const result: HistoryResponse = await response.json();

        if (active) {
          setData(result);
          setError("");
        }
      } catch (err) {
        console.error("Failed to fetch monitor history:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    // Fetch immediately
    void loadHistory();

    // Refresh monitoring data every 30 seconds
    const interval = setInterval(() => {
      void loadHistory();
    }, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return <MonitorLoading />;
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p className="text-red-400">{error}</p>

        <Link
          href="/"
          className="mt-4 inline-block text-blue-400 hover:text-blue-300"
        >
          ← Back to Dashboard
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        No monitoring data available.
      </main>
    );
  }

  const { monitor, stats, checks } = data;

  const latestCheck = checks.at(-1);
  const currentStatus = latestCheck?.status ?? "pending";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Back navigation */}
        <Link
          href="/"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Dashboard
        </Link>

        {/* Monitor header */}
        <header className="mb-10 mt-8">
          <h1 className="text-3xl font-bold">
            {monitor.name}
          </h1>

          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-slate-400 hover:text-blue-400"
          >
            {monitor.url}
          </a>

          <div className="mt-4 flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                currentStatus === "up"
                  ? "bg-green-500"
                  : currentStatus === "down"
                    ? "bg-red-500"
                    : "bg-yellow-500"
              }`}
            />

            <span className="capitalize">
              {currentStatus}
            </span>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="24h Uptime"
            value={
              stats.uptime24h === null
                ? "—"
                : `${stats.uptime24h}%`
            }
          />

          <StatCard
            title="7-Day Uptime"
            value={
              stats.uptime7d === null
                ? "—"
                : `${stats.uptime7d}%`
            }
          />

          <StatCard
            title="Avg Response Time"
            value={
              stats.averageResponseTime === null
                ? "—"
                : `${stats.averageResponseTime}ms`
            }
          />

          <StatCard
            title="Checks (7 Days)"
            value={stats.totalChecks.toString()}
          />
        </section>

        {/* Response time chart */}
        <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Response Time History
          </h2>

          <ResponseTimeChart checks={checks} />
        </section>

        {/* Recent health checks */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-xl font-semibold">
              Recent Health Checks
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Latest monitoring results from the past 7 days
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">HTTP Code</th>
                  <th className="p-4">Response Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {[...checks]
                  .reverse()
                  .slice(0, 20)
                  .map((check) => (
                    <tr
                      key={check.id}
                      className="hover:bg-slate-800/50"
                    >
                      <td className="p-4 text-slate-400">
                        {new Date(
                          check.checkedAt
                        ).toLocaleString()}
                      </td>

                      <td className="p-4">
                        <span
                          className={
                            check.status === "up"
                              ? "font-medium text-green-400"
                              : "font-medium text-red-400"
                          }
                        >
                          {check.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4">
                        {check.statusCode ?? "—"}
                      </td>

                      <td className="p-4">
                        {check.responseTime === null
                          ? "—"
                          : `${check.responseTime}ms`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {checks.length === 0 && (
            <p className="p-6 text-slate-400">
              No health checks recorded yet.
            </p>
          )}
        </section>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Monitoring data refreshes automatically every 30 seconds.
        </p>
      </div>
    </main>
  );
}

// Reusable statistics card
function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
