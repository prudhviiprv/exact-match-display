import { CLASS_LEN, canGo, vehiclePose, type SimSnapshot } from "@/hooks/use-simulation";
import type { Direction, SignalPhase } from "@/types/traffic";

const CLASS_W = { car: 9, truck: 11, bus: 11, motorcycle: 5 };

function lightColor(dir: Direction, phase: SignalPhase) {
  if (canGo(dir, phase)) return "var(--signal)";
  const amber = (dir === "N" || dir === "S") ? phase === "NS_AMBER" : phase === "EW_AMBER";
  return amber ? "var(--warn)" : "var(--crit)";
}

export function Intersection({ snap, overlay, className }: { snap: SimSnapshot; overlay: boolean; className?: string }) {
  const lights: { dir: Direction; x: number; y: number }[] = [
    { dir: "S", x: 160, y: 140 }, { dir: "N", x: 240, y: 260 },
    { dir: "E", x: 140, y: 240 }, { dir: "W", x: 260, y: 160 },
  ];
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Simulated four-way intersection with moving vehicles">
      <defs>
        <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="var(--lane)" strokeOpacity="0.05" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="var(--graphite)" />
      <rect width="400" height="400" fill="url(#g)" />
      {/* blocks */}
      {([[0, 0], [240, 0], [0, 240], [240, 240]] as const).map(([x, y]) => (
        <rect key={`${x}${y}`} x={x + 8} y={y + 8} width={144} height={144} fill="var(--graphite-2)" stroke="var(--lane)" strokeOpacity="0.08" />
      ))}
      {/* roads */}
      <rect x="160" y="0" width="80" height="400" fill="var(--asphalt)" />
      <rect x="0" y="160" width="400" height="80" fill="var(--asphalt)" />
      {/* centre lines */}
      <g stroke="var(--lane)" strokeOpacity="0.45" strokeDasharray="10 10" strokeWidth="1.2">
        <line x1="200" y1="0" x2="200" y2="150" /><line x1="200" y1="250" x2="200" y2="400" />
        <line x1="0" y1="200" x2="150" y2="200" /><line x1="250" y1="200" x2="400" y2="200" />
      </g>
      {/* stop lines */}
      <g stroke="var(--lane)" strokeOpacity="0.8" strokeWidth="2.5">
        <line x1="162" y1="150" x2="200" y2="150" /><line x1="200" y1="250" x2="238" y2="250" />
        <line x1="150" y1="200" x2="150" y2="238" /><line x1="250" y1="162" x2="250" y2="200" />
      </g>
      {/* crosswalk NE */}
      <g fill="var(--lane)" fillOpacity="0.18">
        {Array.from({ length: 6 }).map((_, i) => <rect key={`c${i}`} x={164 + i * 12.5} y={128} width={7} height={18} />)}
      </g>
      {/* signal heads */}
      {lights.map((l) => (
        <g key={l.dir}>
          <circle cx={l.x} cy={l.y} r="6" fill="var(--graphite)" stroke="var(--lane)" strokeOpacity="0.2" />
          <circle cx={l.x} cy={l.y} r="3.5" fill={lightColor(l.dir, snap.phase)} />
        </g>
      ))}
      {/* vehicles */}
      {snap.vehicles.map((v) => {
        const p = vehiclePose(v);
        const len = CLASS_LEN[v.cls], w = CLASS_W[v.cls];
        const horizontal = v.dir === "E" || v.dir === "W";
        const bw = (horizontal ? len : w) + 6, bh = (horizontal ? w : len) + 6;
        const col = v.cls === "bus" ? "var(--warn)" : v.cls === "truck" ? "var(--steel)" : v.cls === "motorcycle" ? "var(--signal)" : "var(--lane)";
        return (
          <g key={v.id}>
            <g transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
              <rect x={-len / 2} y={-w / 2} width={len} height={w} rx={v.cls === "motorcycle" ? 2 : 2} fill={col} fillOpacity={0.92} />
              <rect x={len / 2 - 4} y={-w / 2 + 1} width={2.5} height={w - 2} fill="var(--graphite)" fillOpacity={0.5} />
            </g>
            {overlay && (
              <g>
                <rect x={p.x - bw / 2} y={p.y - bh / 2} width={bw} height={bh} fill="none" stroke="var(--signal)" strokeWidth="0.8" />
                <text x={p.x - bw / 2} y={p.y - bh / 2 - 2} fontSize="5.5" fontFamily="var(--font-mono)" fill="var(--signal)">
                  {v.id} {v.cls} {v.confidence.toFixed(2)}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {/* compass */}
      <g fontFamily="var(--font-mono)" fontSize="8" fill="var(--lane)" fillOpacity="0.5">
        <text x="168" y="12">N</text><text x="226" y="394">S</text><text x="390" y="176">E</text><text x="4" y="232">W</text>
      </g>
    </svg>
  );
}
