import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Pause, Play, ScanLine, AlertTriangle, RefreshCw, Cpu, Thermometer, Battery, Wifi, HardDrive, Inbox,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Logo } from "@/components/layout/SiteNav";
import { Intersection } from "@/components/traffic/Intersection";
import { useSimulation } from "@/hooks/use-simulation";
import { EVENT_LABEL, ZONES, fetchDemoDataset } from "@/data/demo-dataset";
import type { Direction, EventType, Severity, TimeRange, TrafficEvent } from "@/types/traffic";

export const Route = createFileRoute("/command-center")({
  head: () => ({
    meta: [
      { title: "Command Center — FlowGuard" },
      { name: "description", content: "Interactive FlowGuard command center: simulated intersection, detections, events, zones and device health." },
      { property: "og:title", content: "FlowGuard Command Center (Demo)" },
      { property: "og:description", content: "Operate a simulated smart intersection: pause traffic, inspect events and review analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});

const SEV_CLS: Record<Severity, string> = { info: "bg-steel", warning: "bg-warn", critical: "bg-crit" };
const SEV_TEXT: Record<Severity, string> = { info: "text-steel", warning: "text-warn", critical: "text-crit" };
const PHASE_LABEL = { NS_GREEN: "N–S GREEN", NS_AMBER: "N–S AMBER", EW_GREEN: "E–W GREEN", EW_AMBER: "E–W AMBER" };
const DIR_NAME: Record<Direction, string> = { N: "Northbound", S: "Southbound", E: "Eastbound", W: "Westbound" };
const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function Panel({ title, right, children, className = "" }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col bg-background ${className}`} aria-label={title}>
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="label-mono text-muted-foreground">{title}</h2>{right}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function CommandCenter() {
  const [running, setRunning] = useState(true);
  const [overlay, setOverlay] = useState(true);
  const [range, setRange] = useState<TimeRange>("6h");
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<TrafficEvent | null>(null);
  const snap = useSimulation({ running, seed: 7 });
  const q = useQuery({ queryKey: ["demo-dataset", range], queryFn: () => fetchDemoDataset(range) });

  const events = q.data?.events ?? [];
  const filtered = useMemo(
    () => events.filter((e) => (sevFilter === "all" || e.severity === sevFilter) && (!zoneFilter || e.zone === zoneFilter)),
    [events, sevFilter, zoneFilter],
  );
  const zoneCounts = useMemo(() => {
    const m: Record<string, { n: number; worst: Severity | null }> = {};
    ZONES.forEach((z) => (m[z.id] = { n: 0, worst: null }));
    const rank = { info: 0, warning: 1, critical: 2 };
    events.forEach((e) => {
      const z = m[e.zone]; if (!z) return; z.n++;
      if (!z.worst || rank[e.severity] > rank[z.worst]) z.worst = e.severity;
    });
    return m;
  }, [events]);
  const byType = useMemo(() => {
    const m = {} as Record<EventType, number>;
    (Object.keys(EVENT_LABEL) as EventType[]).forEach((k) => (m[k] = 0));
    events.forEach((e) => m[e.type]++);
    return (Object.keys(m) as EventType[]).map((k) => ({ name: EVENT_LABEL[k], count: m[k] }));
  }, [events]);
  const openCrit = events.filter((e) => e.severity === "critical" && e.status !== "resolved").length;

  const totalPassed = snap.passed.N + snap.passed.S + snap.passed.E + snap.passed.W;
  const maxDensity = Math.max(6, ...Object.values(snap.density));
  const health = {
    cpu: Math.min(95, 28 + snap.vehicles.length * 1.6),
    temp: 41 + snap.vehicles.length * 0.25,
    battery: Math.max(5, 86 - snap.elapsed / 60),
    link: running ? "Simulated" : "Idle",
  };
  const congClr = snap.congestion === "heavy" ? "text-crit" : snap.congestion === "moderate" ? "text-warn" : "text-signal";

  return (
    <div className="dark min-h-screen bg-graphite text-foreground">
      {/* Status bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground" aria-label="Back to site"><ArrowLeft className="size-4" /><Logo /></Link>
          <span className="flex items-center gap-1.5 bg-warn px-2 py-1 label-mono text-signal-foreground">
            <span className="size-1.5 rounded-full bg-signal-foreground animate-pulse-dot" /> Demo simulation
          </span>
          <span className="label-mono text-muted-foreground">Unit FG-01 · Grand Ave × 5th (fictional)</span>
          <div className="ml-auto flex items-center gap-4 font-mono text-xs">
            <span>Signal <b className="text-signal">{PHASE_LABEL[snap.phase]}</b> {snap.phaseRemaining.toFixed(0)}s</span>
            <span>State <b className={`uppercase ${congClr}`}>{snap.congestion}</b></span>
            <span className="hidden sm:inline">Open critical <b className="text-crit">{q.isSuccess ? openCrit : "—"}</b></span>
          </div>
        </div>
      </header>

      <main className="grid gap-px bg-border xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Viewport */}
        <Panel title="Intersection viewport · simulated feed" right={
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} aria-pressed={!running} className="flex items-center gap-1.5 border border-border px-2.5 py-1 text-xs hover:bg-secondary">
              {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{running ? "Pause" : "Resume"}
            </button>
            <button onClick={() => setOverlay(!overlay)} aria-pressed={overlay} className={`flex items-center gap-1.5 border px-2.5 py-1 text-xs ${overlay ? "border-signal bg-signal text-signal-foreground" : "border-border hover:bg-secondary"}`}>
              <ScanLine className="size-3.5" />Detections
            </button>
          </div>
        }>
          <div className="relative mx-auto max-w-[720px]">
            <Intersection snap={snap} overlay={overlay} className="aspect-square w-full" />
            {!running && <div className="absolute inset-0 flex items-center justify-center bg-background/40"><span className="label-mono bg-background px-3 py-1.5">Paused</span></div>}
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
            {[
              ["Tracked now", snap.vehicles.length],
              ["Cleared (session)", totalPassed],
              ["Queue estimate", `${snap.queueTotal} veh`],
              ["Sim time", `${Math.floor(snap.elapsed)}s`],
            ].map(([k, v]) => (
              <div key={k} className="bg-background p-3"><p className="label-mono text-muted-foreground">{k}</p><p className="mt-1 font-mono text-xl">{v}</p></div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Panel title="Directional density · live">
            <ul className="space-y-3 p-4">
              {(["N", "S", "E", "W"] as Direction[]).map((d) => (
                <li key={d}>
                  <div className="flex justify-between font-mono text-xs"><span>{DIR_NAME[d]}</span><span className="text-muted-foreground">{snap.density[d]} on approach · {snap.queue[d]} queued · {snap.passed[d]} cleared</span></div>
                  <div className="mt-1.5 h-1.5 bg-secondary"><div className="h-full bg-signal transition-[width] duration-300" style={{ width: `${(snap.density[d] / maxDensity) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-4 gap-px border-t border-border bg-border">
              {(["car", "truck", "bus", "motorcycle"] as const).map((c) => (
                <div key={c} className="bg-background p-3"><p className="label-mono text-muted-foreground">{c === "motorcycle" ? "2-wheel" : c}</p><p className="mt-1 font-mono">{snap.classCounts[c]}</p></div>
              ))}
            </div>
          </Panel>

          <Panel title="Device health · simulated">
            <ul className="divide-y divide-border">
              {[
                [Cpu, "Compute load", `${health.cpu.toFixed(0)}%`, health.cpu > 75],
                [Thermometer, "Board temp", `${health.temp.toFixed(1)}°C`, health.temp > 50],
                [Battery, "Battery", `${health.battery.toFixed(0)}%`, health.battery < 20],
                [Wifi, "Uplink", health.link, false],
                [HardDrive, "Camera / model", "Not connected", true],
              ].map(([Icon, k, v, warn]) => {
                const I = Icon as typeof Cpu;
                return (
                  <li key={k as string} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <I className="size-4 text-muted-foreground" /><span className="flex-1">{k as string}</span>
                    <span className={`font-mono text-xs ${warn ? "text-warn" : "text-foreground"}`}>{v as string}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Zones" className="2xl:col-span-2" right={zoneFilter && <button onClick={() => setZoneFilter(null)} className="label-mono text-signal">Clear zone</button>}>
            <div className="p-4">
              <svg viewBox="0 0 100 100" className="mx-auto aspect-square w-full max-w-[260px]" role="group" aria-label="Zone map">
                <rect x="38" y="0" width="24" height="100" fill="var(--asphalt)" /><rect x="0" y="38" width="100" height="24" fill="var(--asphalt)" />
                {ZONES.map((z) => {
                  const c = zoneCounts[z.id] ?? { n: 0, worst: null }; const active = zoneFilter === z.id;
                  const fill = c.worst === "critical" ? "var(--crit)" : c.worst === "warning" ? "var(--warn)" : c.worst ? "var(--steel)" : "var(--graphite-3)";
                  return (
                    <g key={z.id} role="button" tabIndex={0} aria-label={`${z.name}: ${c.n} events`} aria-pressed={active}
                      onClick={() => setZoneFilter(active ? null : z.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setZoneFilter(active ? null : z.id); } }}
                      className="cursor-pointer outline-none">
                      <rect x={z.x + 1} y={z.y + 1} width={z.w - 2} height={z.h - 2} fill={fill} fillOpacity={active ? 0.75 : 0.3}
                        stroke={active ? "var(--signal)" : fill} strokeWidth={active ? 1 : 0.4} />
                      <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 1.5} textAnchor="middle" fontSize="4.5" fontFamily="var(--font-mono)" fill="var(--paper)">{z.id} · {c.n}</text>
                    </g>
                  );
                })}
              </svg>
              <p className="mt-2 text-center text-xs text-muted-foreground">{zoneFilter ? ZONES.find((z) => z.id === zoneFilter)?.name : "Select a zone to filter events"}</p>
            </div>
          </Panel>
        </div>

        {/* Analytics row */}
        <Panel title="Volume by approach · demo dataset" right={
          <div role="radiogroup" aria-label="Time range" className="flex border border-border">
            {(["1h", "6h", "24h"] as TimeRange[]).map((r) => (
              <button key={r} role="radio" aria-checked={range === r} onClick={() => setRange(r)}
                className={`px-2.5 py-1 font-mono text-xs ${range === r ? "bg-signal text-signal-foreground" : "hover:bg-secondary"}`}>{r}</button>
            ))}
          </div>
        }>
          <div className="h-64 p-3">
            {q.isPending ? <Loading /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : (
              <ResponsiveContainer>
                <AreaChart data={q.data.volume} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--steel)" }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--steel)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--graphite-2)", border: "1px solid var(--graphite-3)", fontSize: 12 }} />
                  {(["N", "S", "E", "W"] as const).map((d, i) => (
                    <Area key={d} type="monotone" dataKey={d} name={DIR_NAME[d]} stackId="1" stroke={`var(--chart-${[1, 2, 3, 5][i]})`} fill={`var(--chart-${[1, 2, 3, 5][i]})`} fillOpacity={0.18} strokeWidth={1.2} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title={`Events by type · last ${range}`}>
          <div className="h-64 p-3">
            {q.isPending ? <Loading /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : (
              <ResponsiveContainer>
                <BarChart data={byType} layout="vertical" margin={{ left: 40, right: 16 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "var(--steel)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "var(--steel)" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "var(--graphite-3)" }} contentStyle={{ background: "var(--graphite-2)", border: "1px solid var(--graphite-3)", fontSize: 12 }} />
                  <Bar dataKey="count" fill="var(--signal)" barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        {/* Timeline */}
        <Panel title={`Event timeline · ${filtered.length} of ${events.length}`} className="xl:col-span-2" right={
          <div role="radiogroup" aria-label="Severity filter" className="flex border border-border">
            {(["all", "critical", "warning", "info"] as const).map((s) => (
              <button key={s} role="radio" aria-checked={sevFilter === s} onClick={() => setSevFilter(s)}
                className={`px-2.5 py-1 font-mono text-xs capitalize ${sevFilter === s ? "bg-foreground text-background" : "hover:bg-secondary"}`}>{s}</button>
            ))}
          </div>
        }>
          {q.isPending ? <div className="h-40"><Loading /></div> : q.isError ? <div className="h-40"><ErrorState onRetry={() => q.refetch()} /></div> : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-sm text-muted-foreground">
              <Inbox className="size-5" />No events match these filters.
              <button onClick={() => { setSevFilter("all"); setZoneFilter(null); }} className="text-signal underline-offset-4 hover:underline">Reset filters</button>
            </div>
          ) : (
            <ol className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {filtered.map((e) => (
                <li key={e.id}>
                  <button onClick={() => setSelected(e)} className="grid w-full grid-cols-[auto_70px_1fr_auto] items-center gap-4 px-4 py-3 text-left hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none sm:grid-cols-[auto_70px_1fr_120px_90px_auto]">
                    <span className={`size-2 ${SEV_CLS[e.severity]}`} aria-label={e.severity} />
                    <span className="font-mono text-xs text-muted-foreground">{fmtTime(e.timestamp)}</span>
                    <span className="truncate text-sm">{e.title} <span className="text-muted-foreground">· {DIR_NAME[e.direction]}</span></span>
                    <span className="hidden font-mono text-xs text-muted-foreground sm:block">{e.zone} · {ZONES.find((z) => z.id === e.zone)?.name}</span>
                    <span className="hidden label-mono text-muted-foreground sm:block">{e.status}</span>
                    <span className="font-mono text-xs text-muted-foreground">{e.id}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </main>

      <footer className="px-4 py-4 text-xs text-muted-foreground">
        All values are produced by a seeded simulator and mock data service. No camera, model, GPS or enforcement system is connected.
      </footer>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="dark border-border bg-background text-foreground sm:rounded-none">
          {selected && (
            <>
              <DialogHeader>
                <p className={`label-mono ${SEV_TEXT[selected.severity]}`}>{selected.severity} · {EVENT_LABEL[selected.type]}</p>
                <DialogTitle className="font-display text-3xl font-normal">{selected.title}</DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-px border border-border bg-border text-sm">
                {[
                  ["Event ID", selected.id],
                  ["Time", new Date(selected.timestamp).toLocaleString()],
                  ["Zone", `${selected.zone} · ${ZONES.find((z) => z.id === selected.zone)?.name}`],
                  ["Direction", DIR_NAME[selected.direction]],
                  ["Vehicles involved", selected.vehiclesInvolved],
                  ["Duration", `${selected.durationMin} min`],
                  ["Status", selected.status],
                  ["Source", "Demo dataset"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-background p-3"><dt className="label-mono text-muted-foreground">{k}</dt><dd className="mt-1 font-mono capitalize">{v}</dd></div>
                ))}
              </dl>
              <div className="flex gap-2">
                <button onClick={() => { setZoneFilter(selected.zone); setSelected(null); }} className="flex-1 bg-signal px-4 py-2 text-sm font-medium text-signal-foreground">Show zone events</button>
                <button onClick={() => setSelected(null)} className="flex-1 border border-border px-4 py-2 text-sm hover:bg-secondary">Close</button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loading() {
  return <div className="flex h-full items-center justify-center gap-2 label-mono text-muted-foreground"><RefreshCw className="size-3.5 animate-spin" />Loading demo dataset</div>;
}
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <AlertTriangle className="size-5 text-warn" />Could not load the dataset.
      <button onClick={onRetry} className="text-signal hover:underline">Retry</button>
    </div>
  );
}
