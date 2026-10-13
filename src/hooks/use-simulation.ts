import { useEffect, useRef, useState } from "react";
import { mulberry32 } from "@/data/demo-dataset";
import type { CongestionState, Direction, SignalPhase, Vehicle, VehicleClass } from "@/types/traffic";

/** Geometry: viewBox 0..400. Each path is 440 long (−20 → 420). */
export const PATH_LEN = 440;
export const STOP_AT = 150; // distance where the stop line sits (approach end)
const CLASS_W: [VehicleClass, number][] = [["car", 0.68], ["truck", 0.1], ["bus", 0.07], ["motorcycle", 0.15]];
export const CLASS_LEN: Record<VehicleClass, number> = { car: 16, truck: 24, bus: 28, motorcycle: 9 };
const PHASES: { phase: SignalPhase; dur: number }[] = [
  { phase: "NS_GREEN", dur: 9 }, { phase: "NS_AMBER", dur: 2.5 },
  { phase: "EW_GREEN", dur: 8 }, { phase: "EW_AMBER", dur: 2.5 },
];
const RATE: Record<Direction, number> = { N: 0.55, S: 0.5, E: 0.42, W: 0.38 };

export function canGo(dir: Direction, phase: SignalPhase) {
  return (dir === "N" || dir === "S") ? phase === "NS_GREEN" : phase === "EW_GREEN";
}

/** Map a vehicle's path distance to SVG coordinates + rotation. */
export function vehiclePose(v: Pick<Vehicle, "dir" | "pos">) {
  const p = v.pos - 20;
  switch (v.dir) {
    case "S": return { x: 182, y: p, rot: 90 };          // heading south (from north)
    case "N": return { x: 218, y: 400 - p, rot: -90 };
    case "E": return { x: p, y: 218, rot: 0 };
    case "W": return { x: 400 - p, y: 182, rot: 180 };
  }
}

export interface SimSnapshot {
  vehicles: Vehicle[];
  phase: SignalPhase;
  phaseRemaining: number;
  passed: Record<Direction, number>;
  classCounts: Record<VehicleClass, number>;
  density: Record<Direction, number>;
  queue: Record<Direction, number>;
  queueTotal: number;
  congestion: CongestionState;
  elapsed: number;
}

const zeroDir = () => ({ N: 0, S: 0, E: 0, W: 0 });

export function useSimulation({ running = true, seed = 7 }: { running?: boolean; seed?: number } = {}) {
  const rng = useRef(mulberry32(seed));
  const st = useRef({
    vehicles: [] as Vehicle[], phaseIdx: 0, phaseT: 0, elapsed: 0, nextId: 1,
    passed: zeroDir(), classCounts: { car: 0, truck: 0, bus: 0, motorcycle: 0 } as Record<VehicleClass, number>,
  });
  const [snap, setSnap] = useState<SimSnapshot>(() => derive(st.current));

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(st.current, dt, rng.current);
      setSnap(derive(st.current));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return snap;
}

type State = {
  vehicles: Vehicle[]; phaseIdx: number; phaseT: number; elapsed: number; nextId: number;
  passed: Record<Direction, number>; classCounts: Record<VehicleClass, number>;
};

function step(s: State, dt: number, r: () => number) {
  s.elapsed += dt;
  s.phaseT += dt;
  if (s.phaseT >= PHASES[s.phaseIdx].dur) { s.phaseT = 0; s.phaseIdx = (s.phaseIdx + 1) % PHASES.length; }
  const phase = PHASES[s.phaseIdx].phase;

  for (const dir of ["N", "S", "E", "W"] as Direction[]) {
    if (r() < RATE[dir] * dt) {
      const lane = s.vehicles.filter((v) => v.dir === dir);
      const lastV = lane.reduce<Vehicle | null>((m, v) => (!m || v.pos < m.pos ? v : m), null);
      if (!lastV || lastV.pos > 34) {
        let x = r(), cls: VehicleClass = "car";
        for (const [c, w] of CLASS_W) { if ((x -= w) <= 0) { cls = c; break; } }
        s.vehicles.push({
          id: `V${String(s.nextId++).padStart(4, "0")}`, dir, cls,
          confidence: 0.72 + r() * 0.26, pos: 0,
          speed: (cls === "motorcycle" ? 70 : cls === "bus" || cls === "truck" ? 48 : 58) * (0.9 + r() * 0.2),
          stopped: false,
        });
      }
    }
  }

  const byDir: Record<Direction, Vehicle[]> = { N: [], S: [], E: [], W: [] };
  s.vehicles.forEach((v) => byDir[v.dir].push(v));
  for (const dir of Object.keys(byDir) as Direction[]) {
    const lane = byDir[dir].sort((a, b) => b.pos - a.pos);
    const go = canGo(dir, phase);
    lane.forEach((v, i) => {
      const half = CLASS_LEN[v.cls] / 2;
      let limit = Infinity;
      if (i > 0) { const lead = lane[i - 1]; limit = lead.pos - CLASS_LEN[lead.cls] / 2 - half - 5; }
      if (!go && v.pos + half <= STOP_AT + 1) limit = Math.min(limit, STOP_AT - half);
      const next = Math.min(v.pos + v.speed * dt, limit);
      v.stopped = next - v.pos < v.speed * dt * 0.2;
      v.pos = Math.max(v.pos, next);
    });
  }
  s.vehicles = s.vehicles.filter((v) => {
    if (v.pos > PATH_LEN) { s.passed[v.dir]++; s.classCounts[v.cls]++; return false; }
    return true;
  });
}

function derive(s: State): SimSnapshot {
  const density = zeroDir(), queue = zeroDir();
  for (const v of s.vehicles) {
    if (v.pos < STOP_AT) { density[v.dir]++; if (v.stopped) queue[v.dir]++; }
  }
  const queueTotal = queue.N + queue.S + queue.E + queue.W;
  const congestion: CongestionState = queueTotal >= 12 ? "heavy" : queueTotal >= 6 ? "moderate" : "free";
  return {
    vehicles: s.vehicles.map((v) => ({ ...v })),
    phase: PHASES[s.phaseIdx].phase,
    phaseRemaining: PHASES[s.phaseIdx].dur - s.phaseT,
    passed: { ...s.passed }, classCounts: { ...s.classCounts },
    density, queue, queueTotal, congestion, elapsed: s.elapsed,
  };
}
