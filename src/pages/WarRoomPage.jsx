import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateMobsterName } from '../utils/nameGenerator';

// Aliased in non-JSX scope so `no-unused-vars` sees `motion` referenced — the
// project's eslint config has no react plugin, so `<motion.div>` in JSX alone
// would read as unused (same reason BureauPage.jsx and Stamp.jsx do this).
const MotionDiv = motion.div;

/**
 * WarRoomPage — THE MOST WANTED LIST. SPEC §7 of the Syndicate War.
 *
 * Renders the weekly wallet board written by syndicate-war/fetch-syndicate.js.
 * The wallet is the competitor; the family is the badge it wears (§5.10). Every
 * scoring term is shown on the row, and every one of the 3,554 holders is
 * searchable — a wallet that is not on the published board still has a true
 * rank and must be able to look itself up (§2 principle #4).
 *
 * DATA CONTRACT — three static files off the same origin, no backend:
 *   /bureau-data/syndicate/season-00/latest.json         { season, week, file }
 *   /bureau-data/syndicate/season-00/week-NN.json        standings, crews, market
 *   /bureau-data/syndicate/season-00/week-NN-roster.json every holder + breakdown
 *
 * latest.json is written ONLY for a real season. Preview runs are quarantined in
 * a preview/ folder and never write it, so the absence of that file is the
 * signal that Season 0 has not been declared — the page says so rather than
 * rendering provisional scores as if they were canon.
 */

const SEASON_DIR = '/bureau-data/syndicate/season-00';
// The Bureau's weekly ranking, published while no season is declared (Toni, 2026-09-27).
const WEEKLY_DIR = '/bureau-data/most-wanted';

// Register names for the NOTORIETY weights, as the scoring sheet prints them.
const TERM = {
  theOutfit: 'The Outfit', theVault: 'The Vault', timeServed: 'Time Served', forHire: 'For Hire',
  theWarChest: 'The War Chest', musclingIn: 'Muscling In', walkedOrFolded: 'Back in the Fold',
  newBlood: 'New Blood', breakingRanks: 'Breaking Ranks',
};
const NEGATIVE = new Set(['forHire', 'breakingRanks']);

// Two files off the same weekly run (Toni, 2026-09-27): Most Wanted is the
// official ranking (Notoriety); On the Move is who is EXPANDING (Momentum).
// Kept to two on purpose: more lists and each one means less.
const LISTS = {
  wanted: { tab: 'Most Wanted', blurb: 'The official ranking. Size, rarity, years held and what you did this week.' },
  move: { tab: 'On the Move', blurb: 'Who is expanding. Buying weighs most here, and it keeps counting for 90 days.' },
};

const C = {
  paper: '#F2EAD3',
  manila: '#C9AE84',
  folder: '#B99C71',
  rust: '#96271F',
  oxide: '#7A5C33',
  gold: '#9A6E14',
  ink: '#141110',
  sub: '#6E5433',
  rule: 'rgba(20,17,16,0.14)',
  well: 'rgba(122,92,51,0.11)',
};
const FONT = {
  display: '"Arial Narrow","Helvetica Neue Condensed",Impact,sans-serif',
  mono: '"Courier New",Courier,ui-monospace,monospace',
  serif: 'Georgia,"Times New Roman",serif',
  // Figures get their own face: Courier's bold is too weak for a value to
  // out-weigh its own label, which is what made the stat line read flat.
  num: '"Helvetica Neue",Helvetica,Arial,sans-serif',
};

const nf = (n) => Number(n).toLocaleString('en-US');
const sign = (n) => (n > 0 ? '+' : '') + Number(n).toFixed(4);

/**
 * Score gaps ALWAYS carry a "pts" suffix and never a bare decimal, because a
 * notoriety gap and an ETH price land in the same range on this collection —
 * "0.0002" (gap) beside "0.0020 Ξ" (the floor) reads as the same kind of number
 * and is not. Tiny gaps also get full precision: rounding 0.000165 to 0.0002
 * throws away the very digits that decide the race.
 */
const pts = (n) => {
  const a = Math.abs(n);
  return `${a < 0.001 ? a.toFixed(6) : a.toFixed(4)} pts`;
};
/** 0x719aB…98785E — six and five, the shape people actually recognise. */
const shortAddr = (a) => `${a.slice(0, 6)}…${a.slice(-5)}`;

function CopyAddress({ address }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={address}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      style={{
        fontFamily: FONT.mono, fontSize: 16, letterSpacing: '0.3px', color: C.ink,
        background: 'none', border: 'none', borderBottom: `1px dotted ${C.folder}`,
        padding: 0, cursor: 'pointer', lineHeight: 1.25,
      }}
    >
      {shortAddr(address)}
      <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '1.2px',
                     color: copied ? C.oxide : C.sub, textTransform: 'uppercase',
                     marginLeft: 7 }}>
        {copied ? '✓ copied' : 'copy'}
      </span>
    </button>
  );
}

/** The nine terms, in the order they appear on every row. */
const TERMS = [
  { k: 'Outfit', key: 'theOutfit', raw: (w) => nf(w.outfit) },
  { k: 'Vault', key: 'theVault', gold: true, raw: (w) => Number(w.vault).toFixed(3) },
  { k: 'Served', key: 'timeServed', raw: (w) => nf(w.servedDays) + 'd' },
  { k: 'For hire', key: 'forHire', raw: (w) => w.forHire || '—' },
  { k: 'War chest', key: 'theWarChest', raw: (w) => (w.warChestEth ? Number(w.warChestEth).toFixed(4) + 'Ξ' : '—') },
  { k: 'Muscling', key: 'musclingIn', raw: (w) => (w.musclingIn ? (w.musclingIn > 0 ? '+' : '') + w.musclingIn : '—') },
  { k: 'Listings', key: 'walkedOrFolded', raw: (w) => (w.foldNet ? (w.foldNet > 0 ? '+' + w.foldNet : String(w.foldNet)) : '—') },
  { k: 'New blood', key: 'newBlood', raw: (w) => w.newBlood || '—' },
  { k: 'Breaking', key: 'breakingRanks', raw: (w) => w.breakingRanks || '—' },
];

/** Phone width: the row stacks instead of running off the right edge. */
const NARROW = '(max-width: 640px)';
function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const m = window.matchMedia(NARROW);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return narrow;
}

function Mugshot({ mug, podium, size = 84 }) {
  const [failed, setFailed] = useState(false);
  const box = {
    gridRow: '1 / 3', width: size, height: size, position: 'relative', overflow: 'hidden',
    border: `2px solid ${podium ? C.gold : C.folder}`, background: C.well, flex: 'none',
  };
  if (!mug || !mug.image || failed) {
    return (
      <div style={box}>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', fontFamily: FONT.mono,
          fontSize: 8.5, letterSpacing: '0.6px', color: C.sub, lineHeight: 1.3,
          padding: 5, textTransform: 'uppercase',
        }}>No photograph<br />on file</span>
      </div>
    );
  }
  return (
    <div style={box}>
      <img
        src={mug.image}
        alt={`Cabone #${mug.tokenId}`}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover',
                 filter: 'grayscale(0.35) contrast(1.06)' }}
      />
      <span style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(20,17,16,0.72)',
        color: C.paper, fontFamily: FONT.mono, fontSize: 8, letterSpacing: '0.5px',
        textAlign: 'center', padding: '1px 0',
      }}>#{mug.tokenId}</span>
    </div>
  );
}

function Pill({ tone, children }) {
  const colour = tone === 'gold' ? C.gold : tone === 'rust' ? C.rust : C.oxide;
  return (
    <span style={{
      display: 'inline-block', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '1px',
      padding: '1px 7px', border: `1px solid ${colour}`, color: colour,
      textTransform: 'uppercase', marginLeft: 4, verticalAlign: 1,
    }}>{children}</span>
  );
}

/**
 * The nine terms on a fixed 5-column grid, so they land 5 on the first line and
 * 4 on the second every time — a wrapping flex row reflowed differently per
 * wallet and made the block impossible to scan down a column.
 */
function TermStrip({ w, narrow }) {
  return (
    <div style={{
      gridColumn: narrow ? '1 / -1' : '3 / 5', marginTop: 11,
      display: 'grid', gridTemplateColumns: `repeat(${narrow ? 3 : 5}, minmax(0, 1fr))`, gap: '9px 14px',
    }}>
      {TERMS.map((t) => {
        const c = w.contributions?.[t.key] ?? 0;
        const zero = c === 0;
        const neg = c < 0;
        const tone = t.gold ? C.gold : neg ? C.rust : C.ink;
        return (
          <div key={t.key} style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '1.2px',
                           textTransform: 'uppercase', color: t.gold ? C.gold : C.sub,
                           opacity: zero ? 0.6 : t.gold ? 0.9 : 1, whiteSpace: 'nowrap',
                           overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.k}</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: FONT.num, fontWeight: zero ? 400 : 700,
                             fontSize: zero ? 14 : 19, lineHeight: 1.05, letterSpacing: '-0.4px',
                             fontVariantNumeric: 'tabular-nums',
                             color: zero ? C.sub : tone, opacity: zero ? 0.5 : 1 }}>{t.raw(w)}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 10, fontVariantNumeric: 'tabular-nums',
                             color: neg ? C.rust : t.gold ? C.gold : C.oxide,
                             opacity: zero ? 0.4 : 1 }}>{zero ? '' : sign(c)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The line you cannot miss. Booking.com's "only one room left and someone is
 * watching it" — the chase in front of you AND the man breathing down your neck,
 * because a rank only bites when you can see both sides of it.
 */
function UrgencyBar({ you, rival, chaser }) {
  const behind = rival ? rival.notoriety - you.notoriety : null;
  const lead = chaser ? you.notoriety - chaser.notoriety : null;
  const mv = you.nextMove;
  return (
    <div style={{
      gridColumn: '1 / 5', marginTop: 13, background: C.rust, color: C.paper,
      border: `2px solid ${C.ink}`, padding: '12px 16px 13px',
      boxShadow: '4px 4px 0 rgba(20,17,16,0.28)',
    }}>
      {mv && rival && (
        <div style={{ fontFamily: FONT.num, fontWeight: 700, fontSize: 19, lineHeight: 1.2,
                      letterSpacing: '-0.3px' }}>
          {mv.label.toUpperCase()}
          {mv.costEth ? ` FOR ${Number(mv.costEth).toFixed(4)} Ξ` : ' — FREE'}
          {' · AND YOU TAKE #'}{rival.rank}
        </div>
      )}
      <div style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: '0.4px',
                    marginTop: mv && rival ? 5 : 0, opacity: 0.94, lineHeight: 1.6 }}>
        {behind != null && <>#{rival.rank} leads you by <strong>{pts(behind)}</strong>. </>}
        {lead != null
          ? <>#{chaser.rank} is <strong>{pts(lead)}</strong> behind you and closing.</>
          : 'Nobody behind you on the board.'}
      </div>
    </div>
  );
}

/**
 * Term-by-term against the wallet directly above. Answers the question a
 * leaderboard usually leaves hanging: not just "how far behind am I" but
 * "on WHAT, and which of it can I actually move."
 */
function Comparison({ you, rival }) {
  const gap = rival.notoriety - you.notoriety;
  const th = {
    padding: '6px 10px', fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: '1.2px',
    textTransform: 'uppercase', color: C.sub, borderBottom: `1px solid ${C.rule}`,
    textAlign: 'right', whiteSpace: 'nowrap',
  };
  const td = { ...th, fontFamily: FONT.num, fontWeight: 700, fontSize: 13, letterSpacing: '-0.2px',
               textTransform: 'none', color: C.ink, fontVariantNumeric: 'tabular-nums' };
  return (
    <div style={{ gridColumn: '1 / 5', marginTop: 12, border: `1px solid ${C.folder}`,
                  background: C.well, padding: '12px 14px 14px' }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '1.4px',
                    textTransform: 'uppercase', color: C.rust, marginBottom: 9 }}>
        You are {pts(gap)} behind #{rival.rank} — here is where it went
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left' }}>Term</th>
              <th style={th}>You</th>
              <th style={th}>#{rival.rank}</th>
              <th style={th}>Difference</th>
              <th style={{ ...th, textAlign: 'left' }}>Standing</th>
            </tr>
          </thead>
          <tbody>
            {TERMS.map((t) => {
              const mine = you.contributions?.[t.key] ?? 0;
              const theirs = rival.contributions?.[t.key] ?? 0;
              const d = mine - theirs;
              const behind = d < -0.00005;
              const ahead = d > 0.00005;
              return (
                <tr key={t.key}>
                  <td style={{ ...td, textAlign: 'left', fontFamily: FONT.mono, fontWeight: 400,
                               fontSize: 10.5, letterSpacing: '1.1px', textTransform: 'uppercase',
                               color: t.gold ? C.gold : C.sub }}>{t.k}</td>
                  <td style={{ ...td, color: t.gold ? C.gold : C.ink }}>{t.raw(you)}</td>
                  <td style={{ ...td, color: C.sub }}>{t.raw(rival)}</td>
                  <td style={{ ...td, color: behind ? C.rust : ahead ? C.oxide : C.sub }}>
                    {d === 0 ? '—' : sign(d)}
                  </td>
                  <td style={{ ...td, textAlign: 'left', fontFamily: FONT.mono, fontWeight: 400,
                               fontSize: 10.5, color: behind ? C.rust : ahead ? C.oxide : C.sub }}>
                    {behind ? 'losing ground here' : ahead ? 'you lead' : 'level'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {you.nextMove && (
        <div style={{ fontFamily: FONT.mono, fontSize: 12, color: C.ink, marginTop: 11,
                      paddingTop: 10, borderTop: `1px dotted ${C.folder}` }}>
          ▸ Cheapest way past them: <strong style={{ color: C.rust }}>{you.nextMove.label}</strong>
          {' — '}
          {you.nextMove.costEth
            ? `${Number(you.nextMove.costEth).toFixed(4)} Ξ`
            : <span style={{ color: C.oxide }}>free</span>}
        </div>
      )}
    </div>
  );
}

function SubjectRow({ w, onSelect, focus, urgency, onInfo }) {
  const [hover, setHover] = useState(false);
  const narrow = useNarrow();
  const podium = w.rank <= 3;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSelect && onSelect(w.address)}
      style={{
        display: 'grid', gridTemplateColumns: narrow ? '56px 44px 1fr' : '84px 64px 1fr auto',
        gap: narrow ? '0 10px' : '0 18px',
        alignItems: 'center', padding: focus ? '16px 14px' : '13px 4px',
        borderBottom: `1px solid ${C.rule}`,
        borderLeft: focus ? `5px solid ${C.rust}` : '5px solid transparent',
        background: focus ? 'rgba(150,39,31,0.07)' : hover ? C.well : 'transparent',
        cursor: onSelect ? 'pointer' : 'default',
      }}
    >
      {focus && (
        <span style={{
          position: 'absolute', marginTop: -34, marginLeft: -6, fontFamily: FONT.mono,
          fontSize: 9, letterSpacing: '2px', color: C.paper, background: C.rust,
          padding: '1px 7px', textTransform: 'uppercase',
        }}>Your file</span>
      )}
      <Mugshot mug={w.mug} podium={podium} size={narrow ? 56 : 84} />
      <div style={{ gridRow: '1 / 3', fontFamily: FONT.display, fontSize: narrow ? 36 : 54, lineHeight: 0.82,
                    color: podium ? C.gold : C.rust, fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right', letterSpacing: '-1.5px' }}>{w.listPos ?? w.rank}</div>
      <div style={{ minWidth: 0 }}>
        {/* The crew name: deterministic per wallet, the same one the rest of the site uses. */}
        <div style={{ fontFamily: FONT.display, textTransform: 'uppercase', fontWeight: 700,
                      fontSize: narrow ? 17 : 21, lineHeight: 1.1, letterSpacing: '0.3px',
                      color: C.ink, marginBottom: 3 }}>
          {generateMobsterName(w.address)?.fullName}
        </div>
        <CopyAddress address={w.address} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap',
                      marginTop: 3 }}>
          <span style={{ fontFamily: FONT.serif, fontSize: 16, color: C.ink,
                         lineHeight: 1.2 }}>{w.family || 'no family'}</span>
          <span style={{ fontFamily: FONT.num, fontWeight: 700, fontSize: 16, color: C.oxide,
                         fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px' }}>
            {Math.round((w.grip || 0) * 100)}%
          </span>
          <span style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: '1.1px',
                         textTransform: 'uppercase', color: C.sub }}>grip</span>
          {w.tiebreak && <Pill tone="rust">tiebreak</Pill>}
          {w.neverSold && <Pill>never sold</Pill>}
          {w.ckg > 0 && <Pill tone="gold">{w.ckg} CKG</Pill>}
          {!w.onBoard && <Pill>unpublished</Pill>}
        </div>
        <Movement w={w} />
        {w.listPos != null && (
          <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.sub, marginTop: 4 }}>
            #{nf(w.rank)} on the Most Wanted list
          </div>
        )}
      </div>
      <div style={{ ...(narrow && { gridColumn: 3, gridRow: 2, textAlign: 'left', marginTop: 4 }),
                    ...(!narrow && { textAlign: 'right' }),
                    fontFamily: FONT.num, fontWeight: 700, fontSize: narrow ? 24 : 34,
                    lineHeight: 1, color: C.ink, fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.8px', whiteSpace: 'nowrap' }}>
        {Number(w.shown?.value ?? w.notoriety).toFixed(4)}
        <span style={{ display: 'block', fontFamily: FONT.mono, fontSize: 8.5,
                       letterSpacing: '1.6px', color: C.sub, textTransform: 'uppercase',
                       marginTop: 3, fontWeight: 400 }}>
          {w.shown?.label ?? 'Notoriety'}
          {onInfo && (
            <button type="button" aria-label="How the score works" title="How the score works"
              onClick={(e) => { e.stopPropagation(); onInfo(); }} style={{
                marginLeft: 5, width: 16, height: 16, borderRadius: '50%', padding: 0,
                border: `1px solid ${C.sub}`, background: 'none', color: C.sub, cursor: 'pointer',
                fontFamily: FONT.serif, fontSize: 10.5, fontWeight: 700, lineHeight: '14px',
                verticalAlign: 'middle', textTransform: 'none',
              }}>i</button>
          )}
        </span>
      </div>
      <TermStrip w={w} narrow={narrow} />
      {/* Focused rows get the loud bar instead; everyone else keeps the quiet hint. */}
      {w.nextMove && !focus && (
        <div style={{ gridColumn: narrow ? '1 / -1' : '3 / 5', fontFamily: FONT.mono, fontSize: 11.5,
                      color: C.sub, marginTop: 8 }}>
          ▸ <span style={{ color: C.rust }}>{w.nextMove.label}</span>
          {' and you pass #'}{w.nextMove.passes}{' · '}
          {w.nextMove.costEth
            ? `${Number(w.nextMove.costEth).toFixed(4)} Ξ`
            : <span style={{ color: C.oxide }}>free</span>}
        </div>
      )}
      {focus && urgency}
    </div>
  );
}

/**
 * "How the score works": the Bureau's scoring sheet as a panel over the board.
 * Weights and caps come from the week's own file, so it cannot drift from the
 * numbers on the rows.
 */
const SHEET = [
  { key: 'theOutfit', what: 'Tokens held. Square-root, so your first ones count most.', max: () => 'the biggest holder' },
  { key: 'timeServed', what: 'Days since your first Al Cabone.', max: () => "the collection's age" },
  { key: 'theVault', what: "Average rarity of what you hold, by OpenSea's own rank.", max: null },
  { key: 'theWarChest', what: 'Real WETH behind your offers. Empty bids score zero.', max: (c) => `${c.warChestTokens} × floor` },
  { key: 'forHire', what: 'Tokens you have listed for sale.', max: (c) => `${c.forHire} listed` },
  { key: 'musclingIn', what: 'This week: tokens bought minus tokens sold.', max: (c) => `${c.musclingIn} net` },
  { key: 'walkedOrFolded', what: 'This week: listings pulled (up) or new listings (down).', max: (c) => `${c.walked} either way` },
  { key: 'newBlood', what: 'This week: sales to wallets new to the collection.', max: (c) => `${c.newBlood}` },
  { key: 'breakingRanks', what: 'This week: sales below the floor.', max: (c) => `${c.breakingRanks}` },
];

function ScoringSheet({ weights, caps, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,17,16,0.6)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto',
      padding: '40px 12px',
    }}>
      <div role="dialog" aria-modal="true" aria-label="How the score works"
           onClick={(e) => e.stopPropagation()} style={{
        background: C.paper, border: `2px solid ${C.ink}`, maxWidth: 760, width: '100%',
        padding: '24px 22px', boxShadow: '8px 8px 0 rgba(20,17,16,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '3px', color: C.rust,
                         textTransform: 'uppercase' }}>Method</span>
          <button autoFocus onClick={onClose} style={{
            fontFamily: FONT.mono, fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase',
            padding: '6px 10px', background: C.well, border: `1px solid ${C.folder}`, cursor: 'pointer',
          }}>Close ✕</button>
        </div>
        <h2 style={{ fontFamily: FONT.display, textTransform: 'uppercase', fontSize: 30,
                     margin: '8px 0 14px', lineHeight: 1 }}>How the Bureau scores Notoriety</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14.5 }}>
            <tbody>
              {SHEET.map((t) => {
                const neg = NEGATIVE.has(t.key);
                return (
                  <tr key={t.key} style={{ borderBottom: `1px solid ${C.rule}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: FONT.display, textTransform: 'uppercase',
                                 fontWeight: 700, whiteSpace: 'nowrap', color: neg ? C.rust : C.ink }}>
                      {TERM[t.key]}</td>
                    <td style={{ padding: 8 }}>{t.what}
                      {t.max && <span style={{ display: 'block', fontFamily: FONT.mono, fontSize: 10.5, color: C.sub }}>
                        maxes at {t.max(caps)}</span>}</td>
                    <td style={{ padding: '8px 0 8px 8px', textAlign: 'right', fontFamily: FONT.num,
                                 fontWeight: 700, fontSize: 18, whiteSpace: 'nowrap', color: neg ? C.rust : C.ink }}>
                      {t.key === 'walkedOrFolded' ? '±' : neg ? '−' : ''}{Math.round((weights[t.key] ?? 0) * 100)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16, background: '#F1E7A8', padding: '14px 16px', fontSize: 14.5 }}>
          <b style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '2px', color: C.rust,
                      textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>How to climb</b>
          <b>Buy</b>: it raises your outfit and your moves at once. <b>Pull your listings</b>: free,
          and it counts twice. <b>Fund your offers</b>: the Bureau checks the WETH. <b>Don&apos;t
          dump</b>: a sale under floor costs more than any buy earns.
        </div>
        <p style={{ fontFamily: FONT.mono, fontSize: 11.5, color: C.sub, margin: '14px 0 0' }}>
          One formula for every holder, every week. Only real sales count: moving tokens between
          your own wallets scores nothing. This week&apos;s moves count for this week only. Stop
          moving and you fall back to your standing.
        </p>
        <p style={{ fontFamily: FONT.mono, fontSize: 11.5, color: C.sub, margin: '8px 0 0' }}>
          <b>On the Move</b> uses <b>Momentum</b>: the same terms, but buying counts 15% and keeps
          counting for 90 days (full for 30, then fading), and years held count 8%, full after a
          year.
        </p>
      </div>
    </div>
  );
}

/**
 * Week on week: tokens held at the start of the week vs now (exact, from the
 * transfer log), and the rank move once a previous weekly edition exists.
 * Tokens moved in without a sale are shown here but never scored.
 */
function Movement({ w }) {
  const lw = w.lastWeek;
  if (!lw) return null;
  const rankMove = lw.rank != null && lw.rank !== w.rank ? lw.rank - w.rank : 0;
  const outfitMoved = lw.outfit !== w.outfit;
  if (!rankMove && !outfitMoved) return null;
  const parts = [];
  if (w.musclingIn > 0) parts.push(`+${w.musclingIn} bought`);
  if (w.musclingIn < 0) parts.push(`${-w.musclingIn} sold`);
  if (lw.movedIn) parts.push(`+${lw.movedIn} moved in`);
  return (
    <div style={{ fontFamily: FONT.mono, fontSize: 11.5, marginTop: 5, color: C.sub }}>
      {rankMove !== 0 && (
        <span style={{ color: rankMove > 0 ? C.oxide : C.rust, fontWeight: 700, marginRight: 10 }}>
          {rankMove > 0 ? '▲' : '▼'} {nf(Math.abs(rankMove))} from #{nf(lw.rank)}
        </span>
      )}
      {outfitMoved && (
        <>
          <b style={{ color: C.ink }}>{nf(lw.outfit)} → {nf(w.outfit)}</b> this week
          {parts.length > 0 && ` · ${parts.join(' · ')}`}
        </>
      )}
    </div>
  );
}

function Card({ kicker, title, children }) {
  return (
    <section style={{
      background: C.paper, border: `2px solid ${C.ink}`, boxShadow: '7px 7px 0 rgba(20,17,16,0.22)',
      padding: '26px 28px 30px', display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {kicker && (
        <span style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '3px',
                       color: C.rust, textTransform: 'uppercase',
                       borderBottom: `2px solid ${C.rule}`, paddingBottom: 8 }}>{kicker}</span>
      )}
      {title && (
        <h2 style={{ fontFamily: FONT.display, textTransform: 'uppercase', letterSpacing: '0.8px',
                     fontSize: 'clamp(25px,4.2vw,40px)', lineHeight: 1, margin: 0 }}>{title}</h2>
      )}
      {children}
    </section>
  );
}

export default function WarRoomPage({ onBack }) {
  const [week, setWeek] = useState(null);
  const [roster, setRoster] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | closed | error
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(10);
  // A wallet picked from several search matches: its neighbourhood replaces the list.
  const [focusAddr, setFocusAddr] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [list, setList] = useState('wanted');

  useEffect(() => {
    let cancelled = false;

    // vercel.json rewrites /(.*) to /index.html, and the Vite dev server does the
    // same, so a MISSING file comes back as 200 with an HTML body — never a 404.
    // Status is therefore useless here; the content-type is what tells the truth.
    const getJson = async (url) => {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return null;
      if (!(res.headers.get('content-type') || '').includes('json')) return null;
      try { return await res.json(); } catch { return null; }
    };

    (async () => {
      try {
        // Canonical season first. Falling back to preview/ makes the board
        // viewable while the season is still closed — that folder is gitignored,
        // so it can only ever resolve locally, and every run in it is flagged
        // provisional and stamped as such on the page.
        let dir = SEASON_DIR;
        let idx = await getJson(`${dir}/latest.json`);
        if (!idx?.file) {
          dir = WEEKLY_DIR;
          idx = await getJson(`${dir}/latest.json`);
        }
        if (!idx?.file) {
          dir = `${SEASON_DIR}/preview`;
          idx = await getJson(`${dir}/latest.json`);
        }
        // Still nothing means no declared season — not an error, a state.
        if (!idx?.file) { if (!cancelled) setState('closed'); return; }
        const stem = idx.file.replace(/\.json$/, '');
        const [w, r] = await Promise.all([
          getJson(`${dir}/${idx.file}`),
          getJson(`${dir}/${stem}-roster.json`),
        ]);
        if (cancelled) return;
        if (!w || !r?.roster) throw new Error(`latest.json points at ${idx.file}, but the week or roster file is missing`);
        setWeek(w); setRoster(r.roster); setState('ready');
      } catch (e) {
        if (!cancelled) { setError(e.message); setState('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const listed = useMemo(() => {
    if (!roster) return [];
    if (list === 'move') return [...roster].sort((a, b) => (b.momentum ?? 0) - (a.momentum ?? 0))
      .map((w, i) => ({ ...w, listPos: i + 1, shown: { label: 'Momentum', value: w.momentum ?? 0 } }));
    return roster;
  }, [roster, list]);

  const matches = useMemo(() => {
    if (!roster) return [];
    const s = q.trim().toLowerCase();
    if (!s) return listed;
    return listed.filter((w) =>
      w.address.toLowerCase().includes(s) || (w.family || '').toLowerCase().includes(s)
      || (generateMobsterName(w.address)?.fullName || '').toLowerCase().replace(/"/g, '')
        .includes(s.replace(/"/g, '')));
  }, [roster, listed, q]);

  useEffect(() => { setLimit(10); setFocusAddr(null); }, [q, list]);

  // A wallet opens its own page in a new tab, so the list stays put.
  const openFile = (addr) => window.open(`/most-wanted/${addr}`, '_blank');

  /**
   * Search down to a single wallet and the board stops being a top-N list and
   * becomes YOUR neighbourhood: three above, you, three below. A rank is only
   * meaningful next to the people you are actually racing.
   */
  const neighbourhood = useMemo(() => {
    const youAddr = focusAddr ?? (matches.length === 1 ? matches[0].address : null);
    if (!roster || !youAddr || list !== 'wanted') return null;
    const i = roster.findIndex((w) => w.address === youAddr);
    if (i < 0) return null;
    const you = roster[i];
    return {
      you,
      rival: i > 0 ? roster[i - 1] : null,
      chaser: i < roster.length - 1 ? roster[i + 1] : null,
      rows: roster.slice(Math.max(0, i - 3), i + 4),
    };
  }, [roster, matches, focusAddr, list]);

  const shell = (children) => (
    <div style={{ background: C.manila, minHeight: '100vh', color: C.ink,
                  fontFamily: FONT.serif, lineHeight: 1.62 }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 18px 80px',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        {onBack && (
          <button onClick={onBack} style={{
            alignSelf: 'flex-start', marginTop: 22, fontFamily: FONT.mono, fontSize: 11,
            letterSpacing: '1.6px', textTransform: 'uppercase', padding: '8px 14px',
            background: C.paper, color: C.ink, border: `1px solid ${C.folder}`, cursor: 'pointer',
          }}>← Back to the files</button>
        )}
        {children}
      </div>
    </div>
  );

  if (state === 'loading') {
    return shell(<Card kicker="NFT Bureau of Investigation">
      <p style={{ fontFamily: FONT.mono, fontSize: 13, color: C.sub, margin: 0 }}>
        Pulling the active file…</p></Card>);
  }

  if (state === 'closed') {
    return shell(
      <Card kicker="NFT Bureau of Investigation · Season 0" title="No war has been declared.">
        <p style={{ margin: 0, maxWidth: '62ch' }}>
          The Syndicate War has not opened. The scoring engine runs and the numbers exist, but
          nothing is canon until the Bureau declares the season — so there is no board to publish.
        </p>
        <p style={{ fontFamily: FONT.mono, fontSize: 11.5, color: C.sub, margin: 0 }}>
          Operator: run <code>node fetch-syndicate.js --open-season</code> to declare Season 0.
          Preview runs are quarantined and deliberately do not write{' '}
          <code>latest.json</code>.
        </p>
      </Card>);
  }

  if (state === 'error') {
    return shell(
      <Card kicker="NFT Bureau of Investigation" title="The file could not be opened.">
        <p style={{ fontFamily: FONT.mono, fontSize: 12, color: C.rust, margin: 0 }}>{error}</p>
      </Card>);
  }

  const el = week.notoriety?.eligibility;
  const market = week.marketState;
  const weekly = week.edition === 'weekly';
  const weekOf = new Date(week.generatedAt).toLocaleDateString('en-GB',
    { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  return shell(
    <>
      {week.provisional && !weekly && (
        <div style={{
          marginTop: 22, background: C.rust, color: C.paper, border: `2px solid ${C.ink}`,
          padding: '10px 16px', fontFamily: FONT.mono, fontSize: 11,
          letterSpacing: '1.6px', textTransform: 'uppercase',
        }}>
          ⚠ Provisional — Season {week.season} is not open. Modelled window, conduct terms zero.
          Not canon.
        </div>
      )}
      <MotionDiv
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{
          marginTop: 22, position: 'relative', overflow: 'hidden', color: C.paper,
          background: 'radial-gradient(120% 130% at 12% -20%,#2B2320 0%,#141110 55%,#0B0908 100%)',
          border: `3px solid ${C.ink}`, boxShadow: '10px 10px 0 rgba(20,17,16,0.22)',
          padding: '38px 30px 30px',
        }}
      >
        <span style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '4px',
                       textTransform: 'uppercase', color: C.manila, display: 'block',
                       marginBottom: 16 }}>
          {weekly
            ? <>NFT Bureau of Investigation · Weekly Ranking · Week of {weekOf}</>
            : <>NFT Bureau of Investigation · Active File · Season {week.season} · Week {week.week}</>}
        </span>
        <h1 style={{ fontFamily: FONT.display, textTransform: 'uppercase', fontWeight: 700,
                     fontSize: 'clamp(46px,11.5vw,124px)', lineHeight: 0.82, letterSpacing: '-1px',
                     margin: '0 0 14px', color: C.paper }}>
          The Most<span style={{ color: '#CE5D50', display: 'block' }}>Wanted</span>List
        </h1>
        <p style={{ fontFamily: FONT.mono, fontSize: 12.5, color: C.manila, letterSpacing: '0.7px',
                    maxWidth: '54ch', lineHeight: 1.7, margin: 0 }}>
          Every wallet holding an Al Cabone is ranked. Not by how many you own — by how many, how
          rare, how long, and what you did this week. Look yourself up and check the numbers.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(112px,1fr))',
                      gap: 20, marginTop: 26, paddingTop: 20,
                      borderTop: '1px solid rgba(201,174,132,0.3)' }}>
          {[
            [nf(roster.length), 'Suspects ranked', false],
            [nf(week.integrity.tokensSeen), 'Cabones at large', false],
            [nf(week.notoriety.distinctScores), 'Distinct scores', true],
            [nf(market.forHire.tokens), 'For hire', false],
            [Number(market.warChest.totalFundedEth).toFixed(3), 'War chest, Ξ', true],
          ].map(([v, k, acc]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <b style={{ fontFamily: FONT.num, fontWeight: 700, fontSize: 30, lineHeight: 1,
                          color: acc ? '#D6A63F' : C.paper, fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '-0.8px' }}>{v}</b>
              <span style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: '1.4px',
                             textTransform: 'uppercase', color: '#A98F63' }}>{k}</span>
            </div>
          ))}
        </div>
      </MotionDiv>

      <Card kicker="The Board" title="Look yourself up.">
        <p style={{ margin: 0, maxWidth: '64ch', fontSize: 15.5 }}>
          All {nf(roster.length)} holders are ranked, not just the big ones. Paste any wallet
          address — or part of one — to pull its file. Every term that counts toward the score is
          on the row.{' '}
          <button type="button" onClick={() => setSheetOpen(true)} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.rust,
            font: 'inherit', textDecoration: 'underline',
          }}>How the score works.</button>
        </p>
        <div role="tablist" aria-label="Bureau lists" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(LISTS).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={list === k} onClick={() => setList(k)} style={{
              fontFamily: FONT.mono, fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase',
              padding: '9px 14px', cursor: 'pointer', border: `2px solid ${C.ink}`,
              background: list === k ? C.ink : C.paper, color: list === k ? C.paper : C.ink,
            }}>{l.tab}</button>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 15, color: C.sub }}>{LISTS[list].blurb}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
                      border: `2px solid ${C.folder}`, padding: '14px 16px', background: C.well }}>
          <label htmlFor="warroom-q" style={{ fontFamily: FONT.mono, fontSize: 10,
                 letterSpacing: '1.6px', textTransform: 'uppercase', color: C.sub }}>
            Find a wallet
          </label>
          <input
            id="warroom-q" type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="0x… address, a crew name, or a family" autoComplete="off" spellCheck="false"
            style={{ flex: 1, minWidth: 230, fontFamily: FONT.mono, fontSize: 14,
                     padding: '9px 12px', background: C.paper, color: C.ink,
                     border: `1px solid ${C.folder}` }}
          />
          <button onClick={() => setQ('')} style={{
            fontFamily: FONT.mono, fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase',
            padding: '9px 14px', background: C.paper, color: C.ink,
            border: `1px solid ${C.folder}`, cursor: 'pointer',
          }}>Top of board</button>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.sub, width: '100%' }}>
            {q.trim()
              ? (focusAddr
                ? <>Showing who&apos;s around your pick.{' '}
                    <button type="button" onClick={() => setFocusAddr(null)} style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      color: C.rust, font: 'inherit', textDecoration: 'underline',
                    }}>Back to all {nf(matches.length)} matches</button></>
                : `${nf(matches.length)} match${matches.length === 1 ? '' : 'es'} for "${q.trim()}"${
                    matches.length > 1 ? ' — pick one to see the three above and below it' : ''}`)
              : `${nf(listed.length)} on this list · ${nf(roster.length)} holders ranked in total.`}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {neighbourhood ? (
            neighbourhood.rows.map((w) => (
              <div key={w.address} style={{ display: 'contents' }}>
                <SubjectRow
                  w={w}
                  onSelect={openFile}
                  onInfo={() => setSheetOpen(true)}
                  focus={w.address === neighbourhood.you.address}
                  urgency={w.address === neighbourhood.you.address ? (
                    <UrgencyBar you={neighbourhood.you} rival={neighbourhood.rival}
                                chaser={neighbourhood.chaser} />
                  ) : null}
                />
                {w.address === neighbourhood.you.address && neighbourhood.rival && (
                  <Comparison you={neighbourhood.you} rival={neighbourhood.rival} />
                )}
              </div>
            ))
          ) : (
            matches.slice(0, limit).map((w) => (
              <SubjectRow key={w.address} w={w} onInfo={() => setSheetOpen(true)}
                          onSelect={q.trim() && list === 'wanted' ? setFocusAddr : openFile} />
            ))
          )}
          {!matches.length && (
            <div style={{ fontFamily: FONT.mono, fontSize: 12.5, color: C.sub, padding: 18,
                          textAlign: 'center', border: `1px dashed ${C.folder}` }}>
              No wallet matches that. Try the first six characters of the address.
            </div>
          )}
        </div>
        {matches.length > limit && (
          <button onClick={() => setLimit((n) => n + 20)} style={{
            fontFamily: FONT.mono, fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase',
            padding: 11, background: C.well, border: `1px dashed ${C.folder}`, color: C.ink,
            cursor: 'pointer', width: '100%',
          }}>Show more — {nf(matches.length - limit)} remaining</button>
        )}
        {el && (
          <p style={{ fontFamily: FONT.mono, fontSize: 11.5, color: C.sub, margin: 0 }}>
            Ranks run to {nf(roster.length)} — every holder has one. The published board details
            the <strong>{nf(el.onBoard)}</strong> wallets holding {el.minOutfit} or more, plus
            anyone who acted this week.
          </p>
        )}
      </Card>

      <Card kicker="The Crews · Seven families" title="The badge you wear.">
        <p style={{ margin: 0, maxWidth: '64ch', fontSize: 15.5 }}>
          You wear the badge of whichever family you hold most of. It is a colour, not a score —
          your Cabones count for you wherever they came from.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: FONT.mono,
                          fontSize: 12.5 }}>
            <thead>
              <tr>
                {['#', 'Crew', 'Badged', 'Own tokens', 'Vault', 'CKG', 'For hire', 'Mean notoriety']
                  .map((h, i) => (
                    <th key={h} style={{ padding: '9px 11px', fontSize: 9, letterSpacing: '1.3px',
                        textTransform: 'uppercase', color: C.sub,
                        borderBottom: `2px solid ${C.folder}`, whiteSpace: 'nowrap',
                        textAlign: i === 1 ? 'left' : 'right' }}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {week.crews.map((c) => (
                <tr key={c.family} style={{
                  background: c.rank === 1 ? 'rgba(154,110,20,0.12)' : 'transparent' }}>
                  <td style={numCell}>{c.rank}</td>
                  <td style={{ ...cell, textAlign: 'left' }}>
                    {c.rank === 1 ? <strong>{c.family}</strong> : c.family}
                  </td>
                  <td style={numCell}>{nf(c.members)}</td>
                  <td style={numCell}>{nf(c.tokensInFamily)}</td>
                  <td style={numCell}>{Number(c.meanVault).toFixed(3)}</td>
                  <td style={numCell}>{nf(c.contractKillersHeld)}</td>
                  <td style={numCell}>{c.forHire}</td>
                  <td style={numCell}>{Number(c.meanNotoriety).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: FONT.mono, fontSize: 11.5, color: C.sub, margin: 0 }}>
          &ldquo;Own tokens&rdquo; is what a crew&rsquo;s badged members hold <em>of that
          family</em> and reconciles to supply. A wallet&rsquo;s tokens in other families are not
          counted here — that conflation is the §3 error.
        </p>
      </Card>

      {sheetOpen && (
        <ScoringSheet weights={week.notoriety.weights} caps={week.notoriety.caps}
                      onClose={() => setSheetOpen(false)} />
      )}

      <Card kicker="Referee's Notes" title="Verify the numbers.">
        <p style={{ margin: 0, maxWidth: '64ch', fontSize: 15.5 }}>
          Weights, constants and every raw input ship in the same JSON this page reads. The
          formula is <strong>{Object.entries(week.notoriety.weights)
            .map(([k, v]) => `${TERM[k] ?? k} ${NEGATIVE.has(k) ? '−' : ''}${Math.round(v * 100)}%`)
            .join(' · ')}</strong>, and every component is scaled to nought-to-one before its
          weight is applied.
        </p>
        {weekly && (
          <p style={{ margin: 0, maxWidth: '64ch', fontSize: 15.5 }}>
            Rarity is OpenSea's own rank, taken as given. This week's moves are counted over the
            seven days to {weekOf}. Tokens moved between wallets without a sale are not scored.
            Every week's file is kept, so any past ranking can be re-checked.
          </p>
        )}
        {week.provisional && !weekly && (
          <div style={{ borderLeft: `5px solid ${C.rust}`, padding: '13px 17px', fontSize: 14.5,
                        background: 'rgba(150,39,31,0.08)' }}>
            <b style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '1.5px',
                        color: C.rust, display: 'block', marginBottom: 4,
                        textTransform: 'uppercase' }}>Provisional</b>
            This run is not canon. The season window is modelled and the conduct terms are zero.
          </div>
        )}
        <p style={{ fontFamily: FONT.mono, fontSize: 11.5, color: C.sub, margin: 0 }}>
          Generated {new Date(week.generatedAt).toISOString().slice(0, 10)} ·{' '}
          {nf(week.integrity.transferLogSize)} transfers replayed ·{' '}
          ownership re-derived with {week.integrity.ownershipDerivedFromTransfers.disagree}{' '}
          disagreements.
        </p>
      </Card>
    </>
  );
}

const cell = {
  padding: '9px 11px', borderBottom: `1px solid ${C.rule}`, verticalAlign: 'top',
  whiteSpace: 'nowrap',
};
const numCell = {
  ...cell, textAlign: 'right', fontFamily: FONT.num, fontWeight: 700, fontSize: 14,
  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.2px',
};
