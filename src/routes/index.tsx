import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  ArrowUpRight, Camera, Cpu, Radar, Route as RouteIcon, BellRing, Layers, Eye, Gauge, Siren,
  Factory, Building2, Battery, Wifi, Database, Code2,
} from "lucide-react";
import heroImg from "@/assets/hero-robot.jpg";
import { SiteNav, Logo } from "@/components/layout/SiteNav";
import { LiveLab } from "@/components/traffic/LiveLab";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowGuard — Read the road before the gridlock" },
      { name: "description", content: "FlowGuard is an autonomous traffic monitoring robot prototype: perception, tracking and congestion intelligence for smart intersections." },
      { property: "og:title", content: "FlowGuard — Autonomous Traffic Monitoring Robot" },
      { property: "og:description", content: "Perception, tracking and congestion intelligence for smart-city intersections. Interactive prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ idx, kicker, title, body }: { idx: string; kicker: string; title: React.ReactNode; body?: string }) {
  return (
    <Reveal className="grid gap-6 md:grid-cols-12">
      <p className="label-mono text-muted-foreground md:col-span-3">{idx} / {kicker}</p>
      <div className="md:col-span-9">
        <h2 className="font-display text-4xl leading-[1.05] md:text-6xl">{title}</h2>
        {body && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{body}</p>}
      </div>
    </Reveal>
  );
}

function Landing() {
  return (
    <div>
      <SiteNav />
      <main>
        <Hero />
        <Problem />
        <Pipeline />
        <section id="live-lab" className="dark scroll-mt-14 bg-background py-24 text-foreground md:py-32">
          <div className="mx-auto max-w-7xl px-5">
            <SectionHead idx="03" kicker="Live Lab" title={<>A junction, <em>simulated</em> honestly.</>} body="A seeded traffic model runs a four-way intersection with a fixed-time signal plan. Toggle the detection overlay to see how tracked objects would be presented to an operator." />
            <Reveal className="mt-14"><LiveLab /></Reveal>
          </div>
        </section>
        <Intelligence />
        <Architecture />
        <Stack />
        <Impact />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const reduce = useReducedMotion();
  return (
    <section id="overview" ref={ref} className="dark grain relative flex min-h-[100svh] scroll-mt-14 items-end overflow-hidden bg-background text-foreground">
      <motion.img src={heroImg} alt="FlowGuard monitoring robot at a wet city intersection at night" width={1920} height={1088}
        style={reduce ? {} : { y }} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
      <div className="hero-fade absolute inset-0" />
      <div className="grid-lines absolute inset-0 opacity-60" />
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-32 md:pb-24">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="label-mono flex items-center gap-2 text-signal">
          <span className="size-1.5 rounded-full bg-signal animate-pulse-dot" /> Autonomous traffic monitoring · Prototype v0.2
        </motion.p>
        <motion.h1 initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }}
          className="mt-6 max-w-4xl font-display text-6xl leading-[0.95] tracking-tight md:text-8xl lg:text-[8.5rem]">
          Read the road.<br /><em className="text-steel">Before the gridlock.</em>
        </motion.h1>
        <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            FlowGuard is a curbside robot designed to watch an intersection, count and classify what moves through it, and flag congestion and incidents to city operators — in seconds, not shifts.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/command-center" className="inline-flex items-center gap-2 bg-signal px-5 py-3 text-sm font-medium text-signal-foreground glow-signal hover:opacity-90">
              Launch Command Center <ArrowUpRight className="size-4" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 border border-input px-5 py-3 text-sm hover:bg-secondary">How it works</a>
          </div>
        </motion.div>
        <div className="mt-16 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
          {[["Sensing", "Camera-first"], ["Compute", "Edge, on-device"], ["Output", "Counts · Events"], ["Status", "Simulation stage"]].map(([k, v]) => (
            <div key={k} className="bg-background/70 p-4 backdrop-blur"><p className="label-mono text-muted-foreground">{k}</p><p className="mt-1 text-sm">{v}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead idx="01" kicker="Problem / Solution" title={<>Cities manage traffic with <em>yesterday’s</em> data.</>} />
        <div className="mt-16 grid gap-px border border-border bg-border md:grid-cols-2">
          <Reveal className="bg-background p-8 md:p-12">
            <p className="label-mono text-crit">The problem</p>
            <ul className="mt-6 space-y-5 text-lg leading-snug">
              <li>Manual counts are periodic, expensive and miss what happens between surveys.</li>
              <li>Fixed cameras are costly to install and rarely analysed in real time.</li>
              <li>Incidents surface through complaints — after the queue has already formed.</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="bg-background p-8 md:p-12">
            <p className="label-mono text-foreground"><span className="bg-signal px-1.5 py-0.5">The approach</span></p>
            <ul className="mt-6 space-y-5 text-lg leading-snug">
              <li>A deployable robot that can be parked where insight is needed, then moved.</li>
              <li>On-device perception turns video into counts and events, not raw footage.</li>
              <li>A command center surfaces queue build-up and incidents as they emerge.</li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const STAGES = [
  { icon: Camera, name: "Capture", body: "Wide-angle camera frames the junction approaches." },
  { icon: Eye, name: "Detect", body: "An object detector (planned: YOLO-class) labels vehicles per frame." },
  { icon: RouteIcon, name: "Track", body: "Detections are linked across frames into stable vehicle IDs." },
  { icon: Gauge, name: "Analyse", body: "Tracks become counts, direction density and queue estimates." },
  { icon: BellRing, name: "Alert", body: "Rule thresholds raise graded events to the command center." },
];

function Pipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const h = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  return (
    <section id="how-it-works" className="dark scroll-mt-14 bg-background py-24 text-foreground md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead idx="02" kicker="Perception pipeline" title={<>From pixels to <em>decisions</em>, in five steps.</>} body="The pipeline is designed to run at the edge so only structured metadata — never continuous video — needs to leave the device." />
        <div ref={ref} className="relative mt-16 md:ml-[25%]">
          <div className="absolute left-[19px] top-0 h-full w-px bg-border" />
          <motion.div style={{ height: h }} className="absolute left-[19px] top-0 w-px bg-signal" />
          {STAGES.map((s, i) => (
            <Reveal key={s.name} className="relative grid grid-cols-[40px_1fr] gap-6 pb-14 last:pb-0">
              <div className="z-10 flex size-10 items-center justify-center border border-border bg-card"><s.icon className="size-4 text-signal" /></div>
              <div className="pt-1.5">
                <p className="label-mono text-muted-foreground">Stage {String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 font-display text-3xl">{s.name}</h3>
                <p className="mt-2 max-w-md text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Intelligence() {
  const items = [
    { icon: Layers, t: "Directional density", b: "Vehicles per approach, split by class — car, truck, bus, two-wheeler." },
    { icon: Gauge, t: "Queue estimation", b: "Stationary tracks behind the stop line approximate queue length per phase." },
    { icon: Siren, t: "Graded incidents", b: "Stalled vehicles, wrong-way tracks and pedestrian conflicts, ranked by severity." },
    { icon: Eye, t: "Event inspection", b: "Every alert opens a detail view: zone, direction, duration, involved vehicles." },
  ];
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead idx="04" kicker="Traffic intelligence" title={<>Signals operators can <em>act on</em>.</>} />
        <div className="mt-16 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.t} delay={i * 0.06} className="border-t border-foreground pt-5">
              <it.icon className="size-5" />
              <h3 className="mt-6 text-lg font-medium">{it.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  const layers = [
    { k: "Edge device", v: ["Camera ingest", "Detector + tracker", "Rules engine"], tag: "Planned hardware" },
    { k: "Data layer", v: ["Event & count API", "Time-series store", "Device telemetry"], tag: "Mock service today" },
    { k: "Command center", v: ["Intersection view", "Event timeline", "Analytics"], tag: "Working prototype" },
  ];
  return (
    <section id="architecture" className="dark grain scroll-mt-14 bg-background py-24 text-foreground md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead idx="05" kicker="System architecture" title={<>Three layers, <em>cleanly</em> separated.</>} body="The UI talks only to a data-service interface. Today that interface is a seeded mock; tomorrow it can be a real computer-vision API or a hosted database — without rewriting the dashboard." />
        <div className="mt-16 grid gap-px border border-border bg-border lg:grid-cols-3">
          {layers.map((l, i) => (
            <Reveal key={l.k} delay={i * 0.08} className="relative bg-background p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">L{i + 1}</span>
                <span className={`label-mono ${i === 2 ? "text-signal" : i === 1 ? "text-warn" : "text-muted-foreground"}`}>{l.tag}</span>
              </div>
              <h3 className="mt-10 font-display text-3xl">{l.k}</h3>
              <ul className="mt-6 space-y-2 font-mono text-sm text-muted-foreground">
                {l.v.map((x) => <li key={x} className="flex items-center gap-2"><span className="h-px w-4 bg-signal" />{x}</li>)}
              </ul>
              {i < 2 && <ArrowUpRight className="absolute right-6 bottom-6 hidden size-4 rotate-45 text-muted-foreground lg:block" />}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stack() {
  const hw = [[Camera, "Wide-FOV camera module"], [Cpu, "Edge AI compute board"], [Radar, "LiDAR (future)"], [Battery, "Battery + power mgmt"], [Wifi, "LTE / Wi-Fi uplink"]] as const;
  const sw = [[Eye, "Object detection model"], [RouteIcon, "Multi-object tracker"], [Database, "Event + count API"], [Code2, "React / TypeScript dashboard"], [Layers, "Recharts analytics"]] as const;
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead idx="06" kicker="Hardware & software" title={<>The <em>stack</em>, with honest status.</>} body="Components marked planned have not yet been integrated or measured. The dashboard and simulator are working today." />
        <div className="mt-16 grid gap-10 md:grid-cols-2">
          {[["Hardware", hw, "Planned"], ["Software", sw, "Prototype"]].map(([title, list, status]) => (
            <Reveal key={title as string}>
              <div className="flex items-baseline justify-between border-b border-foreground pb-3">
                <h3 className="text-lg font-medium">{title as string}</h3>
                <span className="label-mono text-muted-foreground">{status as string}</span>
              </div>
              <ul>
                {(list as typeof hw).map(([Icon, label]) => (
                  <li key={label} className="flex items-center gap-4 border-b border-border py-4"><Icon className="size-4 text-muted-foreground" /><span>{label}</span></li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Impact() {
  return (
    <section id="impact" className="scroll-mt-14 border-t border-border bg-secondary py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead idx="07" kicker="Impact" title={<>Built toward the <em>Sustainable Development Goals</em>.</>} />
        <div className="mt-16 grid gap-px border border-border bg-border md:grid-cols-2">
          {[
            { n: "09", icon: Factory, t: "Industry, Innovation & Infrastructure", b: "Low-cost, redeployable sensing that lets smaller municipalities upgrade road infrastructure intelligence without permanent installations." },
            { n: "11", icon: Building2, t: "Sustainable Cities & Communities", b: "Earlier congestion detection can reduce idling and support safer crossings — outcomes to be validated in future field pilots." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08} className="bg-background p-8 md:p-12">
              <div className="flex items-start justify-between">
                <span className="font-display text-8xl leading-none">{s.n}</span>
                <s.icon className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-8 label-mono text-muted-foreground">SDG {Number(s.n)}</p>
              <h3 className="mt-2 text-2xl font-medium">{s.t}</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">{s.b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="dark bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <Logo />
            <p className="mt-6 max-w-sm font-display text-4xl leading-tight">See congestion forming. <em className="text-steel">Act before it sets.</em></p>
          </div>
          <Link to="/command-center" className="inline-flex items-center gap-2 self-start bg-signal px-5 py-3 text-sm font-medium text-signal-foreground md:self-auto">
            Launch Command Center <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>FlowGuard · College engineering implementation project</p>
          <p>All telemetry shown on this site is simulated demo data.</p>
        </div>
      </div>
    </footer>
  );
}
