
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold">
            Uptime Monitor
          </h1>
          <p className="mt-3 text-slate-400">
            Monitor your websites and APIs in real time.
          </p>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-xl font-semibold">
            Your Monitors
          </h2>

          <p className="mt-4 text-slate-400">
            No websites are being monitored yet.
          </p>

          <button className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500">
            + Add Monitor
          </button>
        </section>
      </div>
    </main>
  );
}
