/**
 * Seeded mock data service. Everything here is DEMO data — swap
 * `fetchDemoDataset` for a real CV / backend API without touching UI code.
 */
import type {
  DemoDataset, Direction, EventType, Severity, TimeRange, TrafficEvent, VolumePoint, Zone,
} from "@/types/traffic";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ZONES: Zone[] = [
  { id: "Z1", name: "North Approach", x: 40, y: 0, w: 20, h: 38 },
  { id: "Z2", name: "South Approach", x: 40, y: 62, w: 20, h: 38 },
  { id: "Z3", name: "East Approach", x: 62, y: 40, w: 38, h: 20 },
  { id: "Z4", name: "West Approach", x: 0, y: 40, w: 38, h: 20 },
  { id: "Z5", name: "Junction Box", x: 40, y: 40, w: 20, h: 20 },
  { id: "Z6", name: "Ped. Crossing NE", x: 62, y: 18, w: 18, h: 18 },
];

const TEMPLATES: Record<EventType, { title: string; desc: string; sev: Severity[] }> = {
  congestion: { title: "Queue build-up", desc: "Simulated queue length exceeded the configured threshold for this approach.", sev: ["warning", "critical"] },
  stalled_vehicle: { title: "Stationary vehicle in lane", desc: "Tracked object stationary beyond dwell threshold outside a stop line.", sev: ["warning", "critical"] },
  wrong_way: { title: "Wrong-way trajectory", desc: "Track heading opposed lane direction for consecutive frames.", sev: ["critical"] },
  pedestrian_conflict: { title: "Pedestrian–vehicle conflict", desc: "Pedestrian and vehicle tracks entered the crossing zone within a short gap.", sev: ["warning", "critical"] },
  signal_fault: { title: "Signal phase anomaly", desc: "Observed phase duration deviated from the expected plan.", sev: ["info", "warning"] },
  sensor_health: { title: "Sensor health notice", desc: "Simulated device telemetry flagged a degraded reading.", sev: ["info"] },
};

const TYPE_WEIGHTS: [EventType, number][] = [
  ["congestion", 0.34], ["stalled_vehicle", 0.16], ["pedestrian_conflict", 0.18],
  ["signal_fault", 0.12], ["sensor_health", 0.14], ["wrong_way", 0.06],
];
const DIRS: Direction[] = ["N", "S", "E", "W"];
const ZONE_FOR_DIR: Record<Direction, string> = { N: "Z1", S: "Z2", E: "Z3", W: "Z4" };

const SEED = 9112;
const HOUR = 3_600_000;
// Fixed anchor so the dataset is stable within an hour across reloads.
function anchor() {
  return Math.floor(Date.now() / HOUR) * HOUR;
}

function pick<T>(r: () => number, weighted: [T, number][]): T {
  let x = r();
  for (const [v, w] of weighted) { if ((x -= w) <= 0) return v; }
  return weighted[weighted.length - 1]![0];
}

/** Hour-of-day demand curve (morning + evening peaks). */
function demand(hour: number) {
  const am = Math.exp(-((hour - 8.5) ** 2) / 3);
  const pm = Math.exp(-((hour - 18) ** 2) / 4);
  return 0.25 + 0.9 * am + 1.0 * pm;
}

function buildAll(): { events: TrafficEvent[]; volume: VolumePoint[] } {
  const r = mulberry32(SEED);
  const end = anchor();
  const volume: VolumePoint[] = [];
  // 24h at 15-min resolution
  for (let i = 96; i > 0; i--) {
    const t = end - i * 15 * 60_000 + 15 * 60_000;
    const d = new Date(t);
    const h = d.getHours() + d.getMinutes() / 60;
    const base = demand(h) * 60;
    const v = (k: number) => Math.round(base * k * (0.85 + r() * 0.3));
    volume.push({
      t,
      label: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      N: v(1.1), S: v(0.95), E: v(0.8), W: v(0.7),
    });
  }
  const events: TrafficEvent[] = [];
  for (let i = 0; i < 46; i++) {
    const type = pick(r, TYPE_WEIGHTS);
    const tpl = TEMPLATES[type];
    const dir = DIRS[Math.floor(r() * 4)]!;
    const ts = end - Math.floor(r() * 24 * HOUR);
    const severity = tpl.sev[Math.floor(r() * tpl.sev.length)]!;
    const zone = type === "pedestrian_conflict" ? "Z6" : type === "signal_fault" || type === "sensor_health" ? "Z5" : ZONE_FOR_DIR[dir];
    const age = end - ts;
    events.push({
      id: `EVT-${(4100 + i).toString()}`,
      type, severity, zone, direction: dir, timestamp: ts,
      title: tpl.title, description: tpl.desc,
      vehiclesInvolved: type === "congestion" ? 6 + Math.floor(r() * 14) : 1 + Math.floor(r() * 2),
      durationMin: 1 + Math.floor(r() * 18),
      status: age > 3 * HOUR ? "resolved" : age > HOUR ? "acknowledged" : "open",
    });
  }
  events.sort((a, b) => b.timestamp - a.timestamp);
  return { events, volume };
}

const RANGE_MS: Record<TimeRange, number> = { "1h": HOUR, "6h": 6 * HOUR, "24h": 24 * HOUR };

/** Mock async service — mirrors the shape a real API would return. */
export async function fetchDemoDataset(range: TimeRange): Promise<DemoDataset> {
  await new Promise((res) => setTimeout(res, 450));
  const { events, volume } = buildAll();
  const end = anchor();
  const from = end - RANGE_MS[range];
  return {
    generatedAt: end,
    range,
    events: events.filter((e) => e.timestamp >= from),
    volume: volume.filter((v) => v.t > from),
  };
}

export const EVENT_LABEL: Record<EventType, string> = {
  congestion: "Congestion",
  stalled_vehicle: "Stalled vehicle",
  wrong_way: "Wrong-way",
  pedestrian_conflict: "Pedestrian conflict",
  signal_fault: "Signal anomaly",
  sensor_health: "Sensor health",
};
