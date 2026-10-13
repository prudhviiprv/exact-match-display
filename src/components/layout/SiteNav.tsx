import { Link } from "@tanstack/react-router";
import { motion, useScroll, useSpring } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

export const NAV = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How It Works" },
  { id: "live-lab", label: "Live Lab" },
  { id: "architecture", label: "Architecture" },
  { id: "impact", label: "Impact" },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <rect x="1" y="1" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1 11H21M11 1V21" stroke="currentColor" strokeWidth="1" opacity=".4" />
        <circle cx="11" cy="11" r="3.5" fill="var(--signal)" />
      </svg>
      <span className="font-mono text-sm font-medium tracking-[0.2em]">FLOWGUARD</span>
    </span>
  );
}

export function SiteNav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const [open, setOpen] = useState(false);
  return (
    <header className="dark fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 text-foreground backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
        <a href="#overview" aria-label="FlowGuard home"><Logo /></a>
        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="label-mono text-muted-foreground transition-colors hover:text-foreground">{n.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/command-center" className="hidden items-center gap-1.5 bg-signal px-3.5 py-2 text-xs font-medium text-signal-foreground transition-opacity hover:opacity-90 sm:inline-flex">
            Launch Command Center <ArrowUpRight className="size-3.5" />
          </Link>
          <button className="p-2 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-border px-5 py-4 md:hidden">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)} className="block py-2.5 label-mono text-muted-foreground">{n.label}</a>
          ))}
          <Link to="/command-center" className="mt-3 inline-flex items-center gap-1.5 bg-signal px-3.5 py-2 text-xs font-medium text-signal-foreground">
            Launch Command Center <ArrowUpRight className="size-3.5" />
          </Link>
        </nav>
      )}
      <motion.div style={{ scaleX }} className="absolute inset-x-0 bottom-0 h-px origin-left bg-signal" />
    </header>
  );
}
