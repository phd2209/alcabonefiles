import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Aliased in non-JSX scope so `no-unused-vars` sees `motion` referenced — the
// project's eslint config has no react plugin, so `<motion.div>` in JSX alone
// would read as unused (same reason Stamp.jsx assigns `motion.div` to a const).
const MotionDiv = motion.div;

/**
 * BureauPage — the canonical /bureau surface.
 *
 * Renders the shared Bureau data layer (public/bureau/latest.json) as an
 * FBI evidence-board dashboard: BUREAU INDEX hero, traffic-light report card,
 * the WANTED BOARD of tracked collections, the KRI breakdown, and a macro
 * strip. The same JSON is what render-thread.js turns into an X thread — one
 * data layer, two renderings (web + Twitter).
 *
 * The `briefing` section is live today; `drops` / `traits` / `bot` sections
 * are scaffolded null and render as "PENDING" field offices until each tool
 * wires its own writer (mirroring briefing/publish-bureau.js).
 */

const BAND = {
  red:    { text: '#9B2F2F', dot: '#9B2F2F', soft: 'rgba(155,47,47,0.12)' },
  yellow: { text: '#8A6D1B', dot: '#E7D47C', soft: 'rgba(231,212,124,0.18)' },
  green:  { text: '#2F6E3E', dot: '#3E8E4F', soft: 'rgba(62,110,79,0.14)' },
};
const bandStyle = (band) => BAND[band] || { text: '#6E5A3E', dot: '#B79C72', soft: 'rgba(183,156,114,0.15)' };

function fmtUsd(v) {
  if (v == null || isNaN(Number(v))) return '—';
  const n = Number(v);
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString('en-US')}`;
}
function fmtPrice(v) {
  if (v == null || isNaN(Number(v))) return '—';
  return `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
function fmtPct(p) {
  if (p == null || isNaN(Number(p))) return '';
  const n = Number(p);
  if (Math.abs(n) < 0.05) return '±0%';
  return `${n > 0 ? '▲' : '▼'}${Math.abs(n).toFixed(1)}%`;
}
const pctColor = (p) => (p == null ? '#6E5A3E' : p > 0 ? '#2F6E3E' : p < 0 ? '#9B2F2F' : '#6E5A3E');

// ── Section primitives ──────────────────────────────────────────────────────

function SectionTitle({ children, sub }) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b-2 border-burnt-shadow/40 pb-1">
      <h2 className="font-heading text-2xl md:text-3xl text-off-white tracking-wide">{children}</h2>
      {sub && <span className="font-typewriter text-xs text-aged-brown uppercase">{sub}</span>}
    </div>
  );
}

function TrafficDot({ band }) {
  const { dot } = bandStyle(band);
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: 14, height: 14, background: dot, boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.35)' }}
    />
  );
}

// A literal red/yellow/green traffic-light fixture for the headline index — the
// band's lamp lit + glowing, the others dimmed. `band` null (suspended) = all dim.
function TrafficLight({ band }) {
  const lamps = [
    { key: 'red', color: '#D6453C' },
    { key: 'yellow', color: '#E7C84A' },
    { key: 'green', color: '#4FAE5C' },
  ];
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-lg p-2.5"
      style={{
        background: '#1B1B1B',
        border: '2px solid #6E5A3E',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.3)',
      }}
      title={band ? `${band.toUpperCase()} zone` : 'no signal'}
    >
      {lamps.map((l) => {
        const on = l.key === band;
        return (
          <div
            key={l.key}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: on ? l.color : '#2A2A2A',
              boxShadow: on
                ? `0 0 12px 3px ${l.color}, inset 0 -2px 5px rgba(0,0,0,0.45)`
                : 'inset 0 2px 5px rgba(0,0,0,0.8)',
              opacity: on ? 1 : 0.45,
              transition: 'opacity 0.3s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// Collection logo for the WANTED BOARD — renders the cached image_url if the
// data carries one, falls back to a monogram chip (also on image load error).
function CollectionLogo({ image, name }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?';
  if (image && !failed) {
    return (
      <img
        src={image}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-9 h-9 rounded object-cover flex-shrink-0"
        style={{ border: '1px solid #6E5A3E' }}
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded flex items-center justify-center font-heading text-sm flex-shrink-0"
      style={{ background: '#6E5A3E', color: '#F4EEDB', border: '1px solid #1B1B1B' }}
    >
      {initials}
    </div>
  );
}

// ── Hero — the BUREAU INDEX headline ────────────────────────────────────────

function IndexHero({ briefing }) {
  const suspended = briefing.composite_suspended || briefing.bureau_index == null;
  const bs = bandStyle(briefing.band);
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="manila-folder relative rounded-lg p-6 md:p-8 evidence-shadow overflow-hidden"
    >
      <div className="thumbtack" style={{ top: 10, left: '50%', transform: 'translateX(-50%)' }} />
      <div className="absolute top-2 right-3 font-typewriter text-[11px] text-burnt-shadow opacity-70">
        FILE NO. {briefing.date} · CLASSIFIED
      </div>

      <p className="font-typewriter text-xs text-burnt-shadow uppercase tracking-widest mb-1">
        Tier 1 · {briefing.title}
      </p>

      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
        <div className="flex items-center gap-4">
          <TrafficLight band={briefing.band} />
          <div>
            <div className="font-heading text-7xl md:text-8xl leading-none text-noir-black">
              {suspended ? '—' : briefing.bureau_index}
              {!suspended && <span className="text-3xl md:text-4xl text-burnt-shadow">/100</span>}
            </div>
            <p className="font-typewriter text-xs text-burnt-shadow mt-1">BUREAU INDEX</p>
          </div>
        </div>

        <div className="flex-1">
          <div
            className="inline-block font-heading text-xl md:text-2xl px-3 py-1 border-2 rounded"
            style={{ color: bs.text, borderColor: bs.text, background: bs.soft }}
          >
            {briefing.band_label}
          </div>
          {briefing.investigation_open && (
            <div className="mt-2 font-heading text-rust-red text-lg tracking-wide">
              ⚠ BUREAU INVESTIGATION OPEN
            </div>
          )}
          <p className="font-typewriter text-sm text-noir-black mt-3 leading-snug">
            {briefing.headline || 'No headline on file.'}
          </p>
        </div>
      </div>

      {/* Diagonal CONFIDENTIAL watermark — brand framing */}
      <div
        className="absolute font-heading pointer-events-none select-none"
        style={{
          right: -10, bottom: -18, fontSize: 96, color: '#9B2F2F', opacity: 0.07,
          transform: 'rotate(-12deg)', letterSpacing: '0.1em',
        }}
      >
        CONFIDENTIAL
      </div>
    </MotionDiv>
  );
}

// ── Chart panel — the BUREAU INDEX chart (SVG preferred, PNG fallback) ─────

function ChartPanel({ briefing }) {
  const src = briefing.chart_svg_path || briefing.chart_png_path;
  if (!src) return null;
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="paper-texture rounded-lg p-4 md:p-5 evidence-shadow"
    >
      <div className="mb-3 flex items-baseline justify-between border-b border-burnt-shadow/30 pb-1">
        <span className="font-heading text-lg md:text-xl text-noir-black tracking-wide">
          BUREAU INDEX — TRAJECTORY
        </span>
        <span className="font-typewriter text-[11px] text-burnt-shadow uppercase">
          Composite + sub-composites · dashed = unobserved
        </span>
      </div>
      <img
        src={src}
        alt={`BUREAU INDEX chart for ${briefing.date}`}
        loading="lazy"
        className="w-full h-auto block"
      />
    </MotionDiv>
  );
}

// ── Report card — sub-composites as traffic lights ──────────────────────────

function ReportCard({ reportCard }) {
  if (!reportCard || reportCard.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {reportCard.map((s) => {
        const bs = bandStyle(s.band);
        return (
          <div key={s.id} className="paper-texture rounded p-4 flex items-center gap-3 evidence-shadow">
            <TrafficDot band={s.band} />
            <div className="flex-1">
              <div className="font-heading text-lg text-noir-black tracking-wide">{s.label}</div>
              <div className="font-typewriter text-xs text-burnt-shadow uppercase">Report-card metric</div>
            </div>
            <div className="font-heading text-3xl" style={{ color: bs.text }}>
              {s.suspended ? 'n/a' : s.score}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── WANTED BOARD — tracked collections ──────────────────────────────────────

function WantedBoard({ board }) {
  if (!board || board.length === 0) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {board.map((c) => (
        <div
          key={c.slug}
          className="paper-texture rounded p-4 relative evidence-shadow"
          style={c.is_hq ? { outline: '2px solid #9B2F2F', outlineOffset: -2 } : undefined}
        >
          {c.is_hq && (
            <div className="absolute -top-2 -right-2 font-heading text-[10px] text-off-white bg-rust-red px-2 py-0.5 rounded rotate-6">
              HQ
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <CollectionLogo image={c.image} name={c.display} />
            <div className="min-w-0">
              <div className="font-heading text-xl text-noir-black tracking-wide leading-none">{c.display}</div>
              <div className="font-typewriter text-[11px] text-burnt-shadow truncate">{c.slug}</div>
            </div>
          </div>

          <div className="font-typewriter text-sm text-noir-black">
            <span className="text-burnt-shadow">FLOOR</span>{' '}
            <span className="font-bold">{c.floor_display ?? '—'} Ξ</span>
          </div>
          <div className="font-typewriter text-xs text-noir-black mt-1">
            <span className="text-burnt-shadow">7d VOL</span>{' '}
            {c.vol_7d_eth != null ? `${c.vol_7d_eth} Ξ` : '—'}
          </div>
          <div className="font-typewriter text-xs text-noir-black">
            <span className="text-burnt-shadow">7d SALES</span> {c.sales_7d ?? '—'}
            {'  ·  '}
            <span className="text-burnt-shadow">BUYERS</span> {c.unique_buyers_7d ?? '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── KRI breakdown — the evidence table ──────────────────────────────────────

function KriBreakdown({ kris }) {
  if (!kris || kris.length === 0) return null;
  return (
    <div className="paper-texture rounded p-4 md:p-5 evidence-shadow">
      <table className="w-full font-typewriter text-sm text-noir-black border-collapse">
        <thead>
          <tr className="text-burnt-shadow text-xs uppercase">
            <th className="text-left pb-2">Key Risk Indicator</th>
            <th className="text-right pb-2">Reading</th>
            <th className="text-right pb-2 w-16">Score</th>
            <th className="text-right pb-2 w-20">QTL</th>
          </tr>
        </thead>
        <tbody>
          {kris.map((k) => (
            <tr key={k.id} className="border-t border-burnt-shadow/25">
              <td className="py-2 pr-2">{k.label}</td>
              <td className="py-2 text-right tabular-nums">{k.value_display}</td>
              <td className="py-2 text-right font-bold tabular-nums">
                {k.missing ? '—' : k.score}
              </td>
              <td className="py-2 text-right">
                {k.qtl_breached ? (
                  <span className="text-rust-red font-bold">BREACH</span>
                ) : (
                  <span className="text-burnt-shadow">ok</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Macro strip ─────────────────────────────────────────────────────────────

function MacroStrip({ macro }) {
  if (!macro) return null;
  const items = [
    { label: 'BTC', value: fmtPrice(macro.btc_usd), chg: macro.btc_change_24h },
    { label: 'ETH', value: fmtPrice(macro.eth_usd), chg: macro.eth_change_24h },
    { label: 'TOTAL MCAP', value: fmtUsd(macro.total_mcap_usd), chg: macro.mcap_change_24h },
    { label: 'NFT FLOOR CAP', value: fmtUsd(macro.nft_floor_cap_usd), chg: null },
    {
      label: 'FEAR & GREED',
      value: macro.fear_greed != null
        ? `${macro.fear_greed}${macro.fear_greed_label ? ` · ${macro.fear_greed_label}` : ''}`
        : '—',
      chg: null,
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {items.map((it) => (
        <div key={it.label} className="paper-texture rounded p-3 evidence-shadow">
          <div className="font-typewriter text-[10px] text-burnt-shadow uppercase tracking-wide">
            {it.label}
          </div>
          <div className="font-heading text-xl text-noir-black leading-tight">{it.value}</div>
          {it.chg != null && (
            <div className="font-typewriter text-xs" style={{ color: pctColor(it.chg) }}>
              {fmtPct(it.chg)} 24h
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Pending field-office placeholder for not-yet-wired sections ─────────────

function PendingSection({ name }) {
  return (
    <div className="paper-texture rounded p-4 evidence-shadow opacity-70">
      <div className="font-heading text-lg text-noir-black tracking-wide">{name}</div>
      <div className="font-typewriter text-xs text-burnt-shadow uppercase">
        Field office not yet reporting — writer pending
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function BureauPage() {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/bureau/latest.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (!cancelled) setDoc(d); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="manila-folder rounded-lg p-6 max-w-md text-center">
          <h1 className="font-heading text-2xl text-rust-red mb-2">EVIDENCE UNAVAILABLE</h1>
          <p className="font-typewriter text-sm text-noir-black">
            Could not load <code>/bureau/latest.json</code> ({error}).
          </p>
          <p className="font-typewriter text-xs text-burnt-shadow mt-3">
            Run <code>node publish-bureau.js</code> in <code>briefing/</code> to generate it.
          </p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-typewriter text-aged-brown text-lg animate-pulse">
          DECLASSIFYING BUREAU FILE…
        </p>
      </div>
    );
  }

  const briefing = doc.sections?.briefing;
  const generated = doc.generated_at ? new Date(doc.generated_at) : null;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Masthead */}
      <header className="mb-8 text-center">
        <p className="font-typewriter text-xs text-aged-brown uppercase tracking-[0.3em] mb-1">
          Federal Bureau of Investigation · NFT Division
        </p>
        <h1 className="font-heading text-5xl md:text-7xl text-off-white tracking-wide">
          THE BUREAU
        </h1>
        <p className="font-typewriter text-sm text-aged-brown">
          Canonical market-intelligence board ·{' '}
          {briefing?.date ? `Briefing ${briefing.date}` : 'Awaiting first briefing'}
        </p>
      </header>

      {!briefing ? (
        <div className="manila-folder rounded-lg p-6 text-center">
          <p className="font-typewriter text-noir-black">
            No briefing section on file. Run the briefing + publish step.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <IndexHero briefing={briefing} />

          <ChartPanel briefing={briefing} />

          <section>
            <SectionTitle sub="Sub-composite traffic lights">REPORT CARD</SectionTitle>
            <ReportCard reportCard={briefing.report_card} />
          </section>

          <section>
            <SectionTitle sub={`${briefing.wanted_board?.length || 0} collections under surveillance`}>
              WANTED BOARD
            </SectionTitle>
            <WantedBoard board={briefing.wanted_board} />
          </section>

          <section>
            <SectionTitle sub="KRIs vs investigation thresholds">EVIDENCE LOG</SectionTitle>
            <KriBreakdown kris={briefing.kris} />
          </section>

          <section>
            <SectionTitle sub="Macro context">THE STREET</SectionTitle>
            <MacroStrip macro={briefing.macro} />
          </section>

          <section>
            <SectionTitle sub="Other tiers — writers pending">FIELD OFFICES</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* drops / traits / bot sections are scaffolded null today — each
                  renders PENDING until its tool wires a publish-bureau writer. */}
              <PendingSection name="TIER 0 — DROPS RADAR" />
              <PendingSection name="FIELD INTEL — TRAITS" />
              <PendingSection name="TIER 3 — INTEL DROPS" />
            </div>
          </section>
        </div>
      )}

      {/* Footer letterhead */}
      <footer className="mt-12 pt-4 border-t-2 border-burnt-shadow/40 text-center">
        <p className="font-typewriter text-xs text-aged-brown">
          {briefing?.sources?.length
            ? `Sources: ${briefing.sources.join(' · ')}`
            : 'Sources on file with the Bureau.'}
        </p>
        <p className="font-typewriter text-xs text-burnt-shadow mt-1">
          {generated ? `Last declassified ${generated.toISOString().slice(0, 16).replace('T', ' ')} UTC` : ''}
          {' · '}schema v{doc.schema_version}
        </p>
        <p className="font-heading text-lg text-off-white mt-2 tracking-widest">
          alcabonefiles.xyz
        </p>
      </footer>
    </div>
  );
}
