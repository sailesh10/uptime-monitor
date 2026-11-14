
"use client";

import { useEffect, useState } from "react";
import type { Monitor } from "@/types/monitor";
import Link from "next/link";

const initialMonitors: Monitor[] = [
  {
    id: "1",
    name: "Google",
    url: "https://google.com",
    status: "up",
    uptime: 99.99,
    responseTime: 120,
    lastChecked: new Date().toISOString(),
  },
  {
    id: "2",
    name: "GitHub",
    url: "https://github.com",
    status: "up",
    uptime: 99.95,
    responseTime: 180,
    lastChecked: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Example Website",
    url: "https://example.com",
    status: "down",
    uptime: 97.2,
    responseTime: null,
    lastChecked: new Date().toISOString(),
  },
];

export default function Home() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [checkingIds, setCheckingIds] = useState<string[]>([]);

  const upCount = monitors.filter(
    (monitor) => monitor.status === "up"
  ).length;

  const downCount = monitors.filter(
    (monitor) => monitor.status === "down"
  ).length;

  async function addMonitor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  
    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add monitor");
      }
  
      setName("");
      setUrl("");
      setShowForm(false);
  
      await fetchMonitors();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to add monitor"
      );
    }
  }


  async function checkMonitor(monitor: Monitor) {
    if (checkingIds.includes(monitor.id)) return;
  
    setCheckingIds((prev) => [...prev, monitor.id]);
  
    try {
      const response = await fetch(
        `/api/monitors/${monitor.id}/check`,
        {
          method: "POST",
        }
      );
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Check failed");
      }
  
      await fetchMonitors();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to check website"
      );
    } finally {
      setCheckingIds((prev) =>
        prev.filter((id) => id !== monitor.id)
      );
    }
  }


  async function fetchMonitors() {
    try {
      const response = await fetch("/api/monitors", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch monitors");
      }

      const data: Monitor[] = await response.json();
      setMonitors(data);
    } catch (error) {
      console.error("Failed to load monitors:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
  
    async function loadMonitors() {
      try {
        const response = await fetch("/api/monitors", {
          cache: "no-store",
        });
  
        if (!response.ok) {
          throw new Error("Failed to fetch monitors");
        }
  
        const data: Monitor[] = await response.json();
  
        if (active) {
          setMonitors(data);
        }
      } catch (error) {
        console.error("Failed to load monitors:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
  
    void loadMonitors();
  
    const interval = setInterval(() => {
      void loadMonitors();
    }, 30_000);
  
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Uptime Monitor
            </h1>
            <p className="mt-2 text-slate-400">
              Monitor your websites and APIs.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500"
          >
            + Add Monitor
          </button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Monitors"
            value={monitors.length}
          />
          <StatCard
            title="Operational"
            value={upCount}
            color="text-green-400"
          />
          <StatCard
            title="Down"
            value={downCount}
            color="text-red-400"
          />
        </section>

        {showForm && (
          <form
            onSubmit={addMonitor}
            className="mb-8 space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold">
              Add New Monitor
            </h2>

            <input
              type="text"
              placeholder="Website name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
            />

            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500"
            >
              Save Monitor
            </button>
          </form>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-xl font-semibold">
              Your Monitors
            </h2>
          </div>

          <div className="divide-y divide-slate-800">
            {loading && (
              <p className="p-6 text-slate-400">
                Loading monitors...
              </p>
            )}
            {monitors.map((monitor) => (
              <div
                key={monitor.id}
                className="flex flex-wrap items-center justify-between gap-4 p-6 hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      monitor.status === "up"
                        ? "bg-green-500"
                        : monitor.status === "down"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  />

                  <div>
                    <Link
                      href={`/monitors/${monitor.id}`}
                      className="font-semibold hover:text-blue-400"
                    >
                      {monitor.name}
                    </Link>

                    <p className="text-sm text-slate-400">
                      {monitor.url}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 text-sm">
                  <div>
                    <p className="text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 font-semibold capitalize">
                      {monitor.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Uptime
                    </p>
                    <p className="mt-1 font-semibold">
                      {monitor.uptime === null
                        ? "—"
                        : `${monitor.uptime}%`}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Response
                    </p>
                    <p className="mt-1 font-semibold">
                      {monitor.responseTime === null
                        ? "—"
                        : `${monitor.responseTime}ms`}
                    </p>
                  </div>
                  <button
                    onClick={() => checkMonitor(monitor)}
                    disabled={checkingIds.includes(monitor.id)}
                    className="self-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkingIds.includes(monitor.id)
                      ? "Checking..."
                      : "Check Status"}
                  </button>
                </div>
              </div>
            ))}
            {!loading && monitors.length === 0 && (
              <p className="p-6 text-slate-400">
                No monitors added yet.
              </p>
            )}
          </div>
        </section>
        <p className="mt-6 text-sm text-slate-500">
          Demo data only. Live monitoring will be added next.
        </p>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  color = "text-white",
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`mt-3 text-3xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}

