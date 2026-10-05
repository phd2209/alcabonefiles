import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { generateMobsterName } from '../utils/nameGenerator';
import WantedPoster from '../components/wanted-poster/WantedPoster';

/**
 * FamilyChartPage — one wallet's Al Cabones as the Bureau's family chart, after the 1963
 * Valachi hearings charts. Opened from a /most-wanted row at /most-wanted/<wallet>.
 *
 * Port of burn-the-ships/org-chart.js (the evidence-board look, Toni, 3 Oct). The men —
 * names, codes, notes, rarity — come precomputed from syndicate-war/publish-charts.js in
 * /bureau-data/most-wanted/<date>-charts.json; this page only lays them out and renders
 * the 2000px-wide sheet to a PNG. Clicking a man opens his Wanted Poster.
 */

const WEEKLY_DIR = '/bureau-data/most-wanted';
const FONTS = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Roboto+Condensed:ital,wght@0,400;0,700;1,700&family=Special+Elite&family=Caveat:wght@600;700&display=swap';

const FAMILY_COLOR = {
  Rambones: '#c2452d', Napolebones: '#e0821f', Corlebones: '#2f6f73', Gambones: '#6a46a8',
  Colombones: '#2e8b57', Boneannos: '#8a5a32', 'Contract Killers Guild': '#222222',
};
// The poster shows the made men; past this many soldiers a regime folds the rest into a strip.
const SHOWN = (total) => (total <= 24 ? 10 : 6);
// A family big enough for three regimes gets three Underbosses, one per district of Syndicate
// City; the rarest runs Downtown, in the middle. Smaller families keep one Underboss.
const DISTRICTS = ['DOWNTOWN', 'THE HARBOR', 'THE NORTH SIDE'];
const W = 2000, TOP = 270;

const fmt = (n) => n.toLocaleString('en-US');
const tierOf = (n) => (n >= 25 ? 'GODFATHER' : n >= 20 ? 'UNDERBOSS' : n >= 15 ? 'CONSIGLIERE'
  : n >= 10 ? 'CAPOREGIME' : 'SOLDIER');

// ---------------------------------------------------------------- the tree (org-chart.js)

function regimesOf(men) {
  // A regime per family; its rarest man is the capo. Regimes ordered by their capo.
  const byFam = {};
  for (const m of men) (byFam[m.family] ||= []).push(m);
  return Object.entries(byFam)
    .map(([family, [capo, ...soldiers]]) => ({ family, capo, soldiers }))
    .sort((a, b) => a.capo.rank - b.capo.rank);
}

function tree(men) {
  // `men` arrives rarest first.
  if (men.length >= 15) {
    const [boss, u1, u2, u3, consigliere, ...rest] = men;
    const regimes = regimesOf(rest);
    if (regimes.length >= 3) {
      // Rarest regimes go Downtown (centre), then the Harbor (left), the rest the North Side (right).
      const c = Math.ceil(regimes.length / 3), l = Math.ceil((regimes.length - c) / 2);
      const groups = [
        { ub: u2, district: DISTRICTS[1], regimes: regimes.slice(c, c + l) },
        { ub: u1, district: DISTRICTS[0], regimes: regimes.slice(0, c) },
        { ub: u3, district: DISTRICTS[2], regimes: regimes.slice(c + l) },
      ];
      return { boss, consigliere, groups, buttons: [] };
    }
  }
  const [boss, ub, consigliere, ...rest] = men;
  if (rest.length < 6) return { boss, consigliere, groups: [{ ub, regimes: [] }], buttons: rest };
  return { boss, consigliere, groups: [{ ub, regimes: regimesOf(rest) }], buttons: [] };
}

// Each man's position on the chart, for his poster.
function rolesOf(men) {
  const T = tree(men), roles = new Map();
  roles.set(T.boss.id, { title: 'BOSS' });
  roles.set(T.consigliere.id, { title: 'CONSIGLIERE' });
  for (const g of T.groups) {
    roles.set(g.ub.id, { title: 'UNDERBOSS', where: g.district });
    for (const r of g.regimes) {
      const where = `${r.capo.name[0]} ${r.capo.name[1]} REGIME`.toUpperCase();
      roles.set(r.capo.id, { title: 'CAPOREGIME', where });
      for (const s of r.soldiers) roles.set(s.id, { title: 'SOLDIER', where });
    }
  }
  for (const b of T.buttons) roles.set(b.id, { title: 'SOLDIER' });
  return roles;
}

// ---------------------------------------------------------------- the sheet

// A polaroid: the man in colour, his name on the margin, the Bureau's typed line under it.
function Polaroid({ m, size, name, role, district, supply, img, open }) {
  const [first, last, nick] = name ? [name.firstName, name.lastName, name.nickname] : m.name;
  const tilt = (((Number(m.id) * 37) % 9) - 4) * 0.45;
  return (
    <div className={`p ${size}`} onClick={() => open(m)}
         style={{ '--fc': FAMILY_COLOR[m.family] || '#555', '--tilt': `${tilt}deg` }}>
      {role && <div className="rl">{role}</div>}
      {district && <div className="ds">{district}</div>}
      <div className="fr">
        {size !== 'sd' && <i className="tp" />}
        <img src={img(m)} crossOrigin="anonymous" alt="" />
        <div className="cap"><b>{first} {last}</b><span>&ldquo;{nick}&rdquo;</span></div>
        <em className="ft">{m.family === 'Contract Killers Guild' ? 'CKG' : m.family}</em>
      </div>
      <div className="ty">
        FBI #{m.id} · #{fmt(m.rank)} OF {fmt(supply)}{m.codes.length ? ` · (${m.codes.join(', ')})` : ''}
      </div>
      {m.note && <div className="no">{m.note}</div>}
    </div>
  );
}

function Sheet({ wallet, rank, men, data, sheetRef, height, onFit, open }) {
  const treeRef = useRef(null);
  const don = generateMobsterName(wallet);
  const T = tree(men);
  const tier = tierOf(men.length);
  const families = new Set(men.map((m) => m.family)).size;
  const regimes = T.groups.flatMap((g) => g.regimes);
  const all = [T.boss, T.consigliere, ...T.groups.map((g) => g.ub), ...T.buttons,
    ...regimes.flatMap((r) => [r.capo, ...r.soldiers])];
  const used = [...new Set(all.flatMap((m) => m.codes))].sort((a, b) => a - b);
  const shown = SHOWN(men.length);
  const one = T.groups.length === 1;
  const img = (m) => (m.img.startsWith('http') ? m.img : data.imgPrefix + m.img);
  const base = { supply: data.supply, img, open };

  // Fit the tree between the header and the footer; a short tree crops the sheet (never below 4:3).
  useLayoutEffect(() => {
    const fit = () => {
      const t = treeRef.current;
      if (!t) return;
      const s = Math.min(1.05, (2000 - TOP - 100) / t.offsetHeight, 1900 / t.offsetWidth);
      t.style.transform = `translateX(-50%) scale(${s})`;
      onFit(Math.max(1500, Math.min(2000, Math.ceil(TOP + t.offsetHeight * s + 120))));
    };
    fit();
    document.fonts?.ready.then(fit);
  }, [men, onFit]);

  const regime = (r) => (
    <div className="rg" key={r.capo.id}>
      <div className="rh">{`${r.capo.name[0]} ${r.capo.name[1]}`.toUpperCase()} REGIME</div>
      <Polaroid {...base} m={r.capo} size="cp" />
      {r.soldiers.length > 0 && <>
        <div className="sb">Soldiers – Buttons</div>
        <div className="sl">{r.soldiers.slice(0, shown).map((m) => <Polaroid {...base} key={m.id} m={m} size="sd" />)}</div>
      </>}
      {r.soldiers.length > shown && (
        <div className="more">
          <div className="ml">+ {r.soldiers.length - shown} MORE BUTTONS</div>
          <div className="th">{r.soldiers.slice(shown).map((m) => (
            <img key={m.id} src={img(m)} crossOrigin="anonymous" alt="" onClick={() => open(m)}
                 style={{ '--fc': FAMILY_COLOR[m.family] || '#555' }} />))}</div>
        </div>
      )}
    </div>
  );

  // Each Underboss hangs his regimes off his own bar. A small crew (no capos) hangs its
  // soldiers off the Underboss directly.
  const group = (g) => {
    const cols = g.regimes.length ? g.regimes.map(regime)
      : T.buttons.map((m) => <div className="rg" key={m.id}><Polaroid {...base} m={m} size="cp" role="SOLDIER" /></div>);
    return (
      <div className="grp" key={g.ub.id}>
        <Polaroid {...base} m={g.ub} size="ad" role="UNDERBOSS" district={g.district} />
        <div className="vl" style={{ height: 26 }} />
        {one && g.regimes.length > 0 && <>
          <div className="capt">CAPOREGIME</div><div className="vl" style={{ height: 20 }} />
        </>}
        <div className="rgs" style={{ gridTemplateColumns: `repeat(${cols.length},${g.regimes.length ? 270 : 300}px)` }}>
          {cols}
        </div>
      </div>
    );
  };

  return (
    <div className="oc" ref={sheetRef} style={{ height }}>
      <div className="chn">CHART {don.lastName[0]}</div>
      <h1>THE {`${don.firstName} ${don.lastName}`.toUpperCase()} FAMILY</h1>
      <div className="sub">COMPILED BY THE BUREAU · SYNDICATE CITY FIELD OFFICE</div>
      <div className="key">
        <h3>KEY TO ACTIVITY CODE</h3>
        {used.map((c) => <div key={c}>{c}. {data.codes[c - 1]}</div>)}
        <div>#: OPENSEA RARITY RANK</div>
      </div>
      <div className="st">
        <span className="b">MOST<br />WANTED #{rank}</span>
        <div className="s">{tier} · {men.length} MADE MEN<br />{families} OF 7 FAMILIES</div>
      </div>
      <div id="tree" ref={treeRef}>
        <div className="top">
          <div />
          <Polaroid {...base} m={T.boss} size="bs" name={don} role="BOSS" />
          <div className="cs"><div className="dash" /><Polaroid {...base} m={T.consigliere} size="ad" role="CONSIGLIERE" /></div>
        </div>
        <div className="vl" style={{ height: 30 }} />
        <div className={`ubs${one ? '' : ' three'}`}>{T.groups.map(group)}</div>
      </div>
      <div className="fo">
        <span>IDENTIFIED FROM THE PUBLIC LEDGER · {wallet.slice(0, 6)}…{wallet.slice(-4)}</span>
        <span>ALCABONEFILES.XYZ/MOST-WANTED · {data.date}</span>
      </div>
    </div>
  );
}

// Under 5 men there is no chart: the wallet is told what it takes to get one (Toni, 5 Oct).
const WORDS = ['no', 'one', 'two', 'three', 'four'];
function NoFile({ addr, held, date }) {
  const don = generateMobsterName(addr);
  const need = 5 - held;
  return (
    <div style={{ maxWidth: 620, margin: '8vh auto 0', background: '#efe8d6', color: '#23211e',
                  padding: '34px 30px', transform: 'rotate(-0.6deg)', boxShadow: '0 10px 30px rgba(0,0,0,.5)',
                  fontFamily: "'Special Elite', monospace", textAlign: 'center', lineHeight: 1.6 }}>
      <div style={{ fontSize: 13, letterSpacing: 3, color: '#6b6250' }}>
        THE BUREAU · {addr.slice(0, 6)}…{addr.slice(-4)}
      </div>
      <h1 style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 700, fontSize: 'clamp(30px, 7vw, 46px)',
                   letterSpacing: 2, lineHeight: 1.1, margin: '14px 0 18px' }}>
        NO FILE ON {`${don.firstName} ${don.lastName}`.toUpperCase()}. YET.
      </h1>
      <p style={{ fontSize: 17, margin: '0 0 8px' }}>
        {held ? `${held} Al Cabone${held > 1 ? 's' : ''} on the books (${date}).` : `No Al Cabones on the books (${date}).`}
      </p>
      <p style={{ fontSize: 17, margin: '0 0 24px' }}>
        The Bureau opens a family chart at 5. {need === 5 ? 'Five men' : `${WORDS[need][0].toUpperCase()}${WORDS[need].slice(1)} more`} and
        this family goes up on the wall.
      </p>
      <a href="https://opensea.io/collection/thealcabones" target="_blank" rel="noreferrer" style={{
        display: 'inline-block', border: '3px solid #b3261e', color: '#b3261e', padding: '8px 18px',
        fontFamily: 'Oswald, sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: 3, textDecoration: 'none',
      }}>RECRUIT ON OPENSEA</a>
    </div>
  );
}

// ---------------------------------------------------------------- the page

export default function FamilyChartPage({ wallet }) {
  const addr = wallet.toLowerCase();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [height, setHeight] = useState(2000);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [poster, setPoster] = useState(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    // The sheet's fonts, crossorigin so the PNG export can read and embed them.
    if (!document.querySelector(`link[href="${FONTS}"]`)) {
      const l = document.createElement('link');
      Object.assign(l, { rel: 'stylesheet', href: FONTS, crossOrigin: 'anonymous' });
      document.head.appendChild(l);
    }
    (async () => {
      try {
        const idx = await (await fetch(`${WEEKLY_DIR}/latest.json`, { cache: 'no-cache' })).json();
        const res = await fetch(`${WEEKLY_DIR}/${idx.date}-charts.json`);
        if (!res.ok) throw new Error(`no family charts for the ${idx.date} edition`);
        setData(await res.json());
      } catch (e) { setError(e.message); }
    })();
  }, []);

  useEffect(() => {
    const onResize = () => setScale(Math.min(1, (window.innerWidth - 32) / W));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const entry = data?.wallets[addr];
  const don = generateMobsterName(addr);
  const roles = useMemo(() => entry && rolesOf(entry.men), [entry]);
  const closePoster = useCallback(() => setPoster(null), []);
  useEffect(() => { document.title = `The ${don.firstName} ${don.lastName} Family · alcabonefiles`; },
    [don.firstName, don.lastName]);

  const download = async () => {
    setBusy(true);
    try {
      const url = await toPng(sheetRef.current, { width: W, height, pixelRatio: 1 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${don.firstName}-${don.lastName}-family-chart.png`.toLowerCase();
      a.click();
    } catch (e) { setError(`PNG failed: ${e.message || e}`); }
    setBusy(false);
  };

  const btn = { fontFamily: "'Special Elite', monospace", fontSize: 14, letterSpacing: 2, padding: '9px 16px',
    border: '1px solid #b9ad92', background: 'none', color: '#efe6d2', cursor: 'pointer', textDecoration: 'none' };
  return (
    <div style={{ minHeight: '100vh', background: '#151311', color: '#efe6d2', padding: '16px' }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: W, margin: '0 auto 16px', display: 'flex', gap: 12, flexWrap: 'wrap',
                    justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/most-wanted" style={btn}>← THE MOST WANTED LIST</a>
        {entry && <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 14, letterSpacing: 2, color: '#b9ad92' }}>
          CLICK A MAN FOR HIS WANTED POSTER</span>}
        {entry && <button type="button" onClick={download} disabled={busy} style={btn}>
          {busy ? 'DEVELOPING…' : 'DOWNLOAD PNG'}</button>}
      </div>
      {error && <p style={{ textAlign: 'center', fontFamily: 'monospace' }}>{error}</p>}
      {!data && !error && <p style={{ textAlign: 'center', fontFamily: 'monospace' }}>Pulling the file…</p>}
      {data && !entry && <NoFile addr={addr} held={data.small?.[addr] ?? 0} date={data.date} />}
      {entry && (
        <div style={{ width: W * scale, height: height * scale, margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: W }}>
            <Sheet wallet={addr} rank={entry.rank} men={entry.men} data={data}
                   sheetRef={sheetRef} height={height} onFit={setHeight} open={setPoster} />
          </div>
        </div>
      )}
      {poster && (
        <WantedPoster m={poster} role={roles.get(poster.id)} onClose={closePoster}
          name={roles.get(poster.id).title === 'BOSS' ? [don.firstName, don.lastName, don.nickname] : poster.name}
          color={FAMILY_COLOR[poster.family] || '#555'}
          img={poster.img.startsWith('http') ? poster.img : data.imgPrefix + poster.img}
          supply={data.supply} codes={data.codes} family={`${don.firstName} ${don.lastName}`}
          rank={entry.rank} wallet={addr} date={data.date} />
      )}
    </div>
  );
}

// Evidence board: charcoal cork, red string, cream index cards (Toni's pick, 3 Oct).
// org-chart.js's stylesheet, scoped to the sheet.
const CSS = `
.oc{--bg:#1f1d1a;--ink:#efe6d2;--sub:#b9ad92;--line:#b3261e;--lw:3px;--card:#f7f3ea;--keybg:#efe8d6;--dash:dashed;
width:2000px;overflow:hidden;background:var(--bg);color:var(--ink);font-family:'Roboto Condensed',sans-serif;position:relative;text-align:left}
.oc *{margin:0;box-sizing:border-box}
.oc:before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:20}
.oc:after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,transparent 55%,rgba(0,0,0,.32));pointer-events:none;z-index:21}
.oc .chn{position:absolute;top:34px;left:0;right:0;text-align:center;font-family:'Special Elite';font-size:22px;letter-spacing:3px;color:var(--sub)}
.oc h1{position:absolute;top:74px;left:0;right:0;text-align:center;font-family:Oswald;font-weight:700;font-size:116px;letter-spacing:6px;line-height:1}
.oc .sub{position:absolute;top:202px;left:0;right:0;text-align:center;font-family:'Special Elite';font-size:22px;letter-spacing:4px;color:var(--sub)}
.oc .key{position:absolute;top:262px;left:60px;width:360px;background:var(--keybg);color:#23211e;border:1px solid #9c978a;padding:16px 20px;font-size:17px;line-height:1.45;z-index:3;transform:rotate(-1deg);box-shadow:0 6px 14px rgba(0,0,0,.18)}
.oc .key h3{font-weight:700;font-size:20px;text-align:center;letter-spacing:1px;margin-bottom:8px;text-decoration:underline}
.oc .st{position:absolute;top:262px;right:50px;width:340px;text-align:center;z-index:3}
.oc .st .b{display:inline-block;border:6px solid #b3261e;color:#b3261e;font-family:Oswald;font-weight:700;font-size:52px;letter-spacing:5px;padding:4px 20px;transform:rotate(-6deg);opacity:.9;line-height:1.1}
.oc .st .s{margin-top:20px;font-family:'Special Elite';font-size:21px;letter-spacing:2px;line-height:1.6;color:var(--sub)}
.oc #tree{position:absolute;top:270px;left:50%;width:max-content;transform-origin:top center;display:flex;flex-direction:column;align-items:center}
.oc .p{display:flex;flex-direction:column;align-items:center;text-align:center;cursor:pointer}
.oc .fr{position:relative;background:var(--card);padding:9px 9px 0;box-shadow:0 8px 18px rgba(0,0,0,.28),0 1px 2px rgba(0,0,0,.2);transform:rotate(var(--tilt));border-bottom:7px solid var(--fc)}
.oc .fr img{display:block;object-fit:cover;background:#999;max-width:none}
.oc .cap{color:#1d1c1a;padding:6px 4px 8px;line-height:1.05}
.oc .cap b{display:block;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
.oc .cap span{display:block;font-family:Caveat;font-weight:700;color:#2b2a27}
.oc .ft{position:absolute;top:12px;left:12px;font-style:normal;font-weight:700;font-size:11px;letter-spacing:1px;color:#fff;background:var(--fc);padding:2px 6px;text-transform:uppercase}
.oc .tp{position:absolute;top:-14px;left:50%;width:90px;height:26px;margin-left:-45px;background:rgba(235,228,205,.72);transform:rotate(-3deg);box-shadow:0 1px 2px rgba(0,0,0,.15)}
.oc .ty{margin-top:10px;font-family:'Special Elite';color:var(--sub);letter-spacing:.5px;white-space:nowrap}
.oc .no{margin-top:3px;font-weight:700;letter-spacing:1px;max-width:300px}
.oc .rl{font-style:italic;font-weight:700;letter-spacing:1px;margin-bottom:12px}
.oc .bs .fr img{width:250px;height:292px}.oc .bs .cap b{font-size:30px}.oc .bs .cap span{font-size:40px}.oc .bs .ty{font-size:20px}.oc .bs .no{font-size:18px}.oc .bs .rl{font-size:46px}
.oc .ad .fr img{width:170px;height:198px}.oc .ad .cap b{font-size:21px}.oc .ad .cap span{font-size:29px}.oc .ad .ty{font-size:16px}.oc .ad .no{font-size:14px}.oc .ad .rl{font-size:32px}
.oc .cp .fr img{width:130px;height:152px}.oc .cp .cap b{font-size:16px}.oc .cp .cap span{font-size:23px}.oc .cp .ty{font-size:13px}.oc .cp .no{font-size:12px;max-width:200px}.oc .cp .rl{font-size:22px}
.oc .sd .fr{padding:6px 6px 0;border-bottom-width:5px}.oc .sd .fr img{width:92px;height:107px}.oc .sd .cap{padding:4px 2px 5px}.oc .sd .cap b{font-size:12px}.oc .sd .cap span{font-size:17px}.oc .sd .ty{font-size:10px;margin-top:6px;white-space:normal;width:112px;line-height:1.3}.oc .sd .no{font-size:9.5px;max-width:120px}
.oc .sd .ft{display:none}
.oc .vl{width:var(--lw);background:var(--line);margin:0 auto}
.oc .top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;width:1300px}
.oc .top .cs{display:flex;align-items:center;justify-self:start}
.oc .top .dash{width:110px;border-top:var(--lw) var(--dash) var(--line);margin-right:18px}
.oc .capt{font-size:52px;letter-spacing:46px;padding-left:46px;margin:14px 0}
.oc .rgs{display:grid}
.oc .ubs{display:flex;align-items:flex-start}
.oc .grp{position:relative;padding-top:40px;display:flex;flex-direction:column;align-items:center}
.oc .grp:before{content:'';position:absolute;top:0;left:0;right:0;border-top:var(--lw) solid var(--line)}
.oc .grp:first-child:before{left:50%}.oc .grp:last-child:before{right:50%}.oc .grp:only-child:before{display:none}
.oc .grp:after{content:'';position:absolute;top:0;left:50%;height:40px;margin-left:calc(var(--lw) / -2);border-left:var(--lw) solid var(--line)}
.oc .ubs.three .grp>.ad{min-height:410px}
.oc .ds{font-family:'Special Elite';letter-spacing:3px;color:var(--sub);margin:-6px 0 12px;font-size:17px}
.oc .rg{position:relative;padding-top:46px;display:flex;flex-direction:column;align-items:center}
.oc .rg:before{content:'';position:absolute;top:0;left:0;right:0;border-top:var(--lw) solid var(--line)}
.oc .rg:first-child:before{left:50%}.oc .rg:last-child:before{right:50%}.oc .rg:only-child:before{display:none}
.oc .rg:after{content:'';position:absolute;top:0;left:50%;height:46px;margin-left:calc(var(--lw) / -2);border-left:var(--lw) solid var(--line)}
.oc .rh{font-style:italic;font-weight:700;font-size:17px;letter-spacing:.5px;margin-bottom:14px;white-space:nowrap}
.oc .sb{font-weight:700;font-size:15px;margin:20px 0 12px;letter-spacing:.5px}
.oc .sl{display:grid;grid-template-columns:repeat(2,auto);gap:16px 14px}
.oc .more{margin-top:16px;text-align:center}
.oc .ml{font-family:'Special Elite';font-size:14px;letter-spacing:2px;margin-bottom:8px;color:var(--sub)}
.oc .th{display:grid;grid-template-columns:repeat(7,30px);gap:4px;justify-content:center}
.oc .th img{cursor:pointer;width:30px;height:35px;object-fit:cover;border-bottom:3px solid var(--fc);background:#999;max-width:none}
.oc .fo{position:absolute;bottom:34px;left:70px;right:70px;display:flex;justify-content:space-between;font-family:'Special Elite';font-size:19px;letter-spacing:1px;color:var(--sub);z-index:3}
`;
