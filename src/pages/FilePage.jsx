import { useState, useEffect, useRef, Fragment } from 'react';
import { toPng } from 'html-to-image';
import { generateMobsterName } from '../utils/nameGenerator';
import { FONTS } from './FamilyChartPage';

/**
 * FilePage — the Chain of Custody (Toni, 4 Nov; mock: burn-the-ships/out/mock-custody-6586.html).
 * Any Al Cabone by number: who held him, for how long, what they paid and how he changed hands,
 * with the Bureau's finding on top. Collection-neutral on purpose (BAYC/Pudgy may follow).
 * Data: /bureau-data/files/<id / 100>.json from syndicate-war/publish-charts.js, weekly; no API
 * calls. Every sentence here is built from that data: never write a claim it can't back.
 */

const FILES_DIR = '/bureau-data/files';
const W = 1200;
const CONTRACT = '0x8ca5…ba23';

const fmt = (n) => n.toLocaleString('en-US');
const date = (s) => new Date(s * 1000).toLocaleDateString('en-US',
  { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (n) => NUM[n] ?? String(n);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
// "4 days", "5 months", "three and a half years"
function span(days) {
  if (days < 45) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 365) return `${Math.round(days / 30.4)} months`;
  const h = Math.floor(days / 182.5) / 2, w = Math.floor(h);   // rounded down: never overstate
  if (h === w) return w === 1 ? 'a year' : `${word(w)} years`;
  return w === 1 ? 'a year and a half' : `${word(w)} and a half years`;
}
// A sale above zero never reads as "100% down" (0.0004 after 0.08 is 99.5%, not everything).
const pctOf = (p, q) => { const r = Math.round((100 * (p - q)) / q); return p > 0 && r <= -100 ? -99 : r; };

// Who a wallet is: its OpenSea profile, or the Bureau's name for it.
function person(addr, people) {
  const p = people[addr] ?? {};
  const named = p.u && !/^0x[0-9a-f]{3,}/i.test(p.u);
  const g = generateMobsterName(addr);
  return {
    name: named ? p.u : `${g.firstName} “${g.nickname}” ${g.lastName}`,
    named, img: p.img, x: p.x,
    sub: !named ? `No name on file · ${addr.slice(0, 6)}…${addr.slice(-4)}`
      : p.bio && !/^0x/.test(p.bio) && p.bio.replace(/\W/g, '').toLowerCase() !== p.u.replace(/\W/g, '').toLowerCase()
        ? `“${p.bio.split('\n')[0].slice(0, 48)}”`
      : p.joined ? `On OpenSea since ${new Date(p.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : '',
  };
}

// The custody stints, oldest first: who held him, when, how he arrived, what the seller made.
function stints(m, asOfS) {
  return m.record.map((e, i) => {
    const [t, kind, , to, price, sweep] = e;
    const next = m.record[i + 1];
    const prevPaid = m.record.slice(0, i).reverse().find((x) => x[4] != null && x[3] === e[2])?.[4] ?? null;
    return { i, t, kind, to, price: price ?? null, sweep: sweep ?? null, out: next ? next[0] : null,
      days: Math.round(((next ? next[0] : asOfS) - t) / 86400), prevPaid, now: !next };
  });
}

// The Old City (Toni, 5 Nov): the first contract, before the 2021 recall. m.crossed = [when, how]:
// R handed in, old token burned · W handed in, old token still in the warehouse · L never handed in.
const OLD_CONTRACT = '0x3921…316b';
const CROSSING = {
  R: (who) => `Carried across by ${who}. The bridge burned behind them.`,
  W: (who) => `Carried across by ${who}. His old papers are still in the warehouse by the old docks.`,
  L: (who) => `${who} never handed him in. He came over on the last boat.`,
};

function arrival(s) {
  if (s.kind === 'B') return { head: 'MINTED', sub: 'Made in the Old City' };
  if (s.kind === 'M') return { head: 'HANDED OVER', sub: 'No sale on record' };
  const head = `${s.kind === 'I' ? 'BID TAKEN' : 'BOUGHT'} · ${s.price} ETH`;
  const tone = s.prevPaid ? (s.price > s.prevPaid ? 'up' : s.price < s.prevPaid ? 'dn' : '') : '';
  const sub = s.sweep ? `Taken in a sweep of ${s.sweep}`
    : s.prevPaid ? (s.price === s.prevPaid ? 'Seller walked away even'
      : `Seller walked away ${Math.abs(pctOf(s.price, s.prevPaid))}% ${s.price > s.prevPaid ? 'up' : 'down'}`)
    : s.kind === 'I' ? 'Seller took the standing bid' : 'Bought off a listing';
  return { head, sub, tone };
}

// The Bureau's finding: his most remarkable facts, a sentence each, at most four.
function finding(m, S, people, city) {
  const who = (s) => person(s.to, people).name;
  const out = [];
  const years = Math.max(1, Math.round((S.at(-1).t + S.at(-1).days * 86400 - S[0].t) / 86400 / 365));
  if (S.length === 1) {
    out.push(`Booked ${date(S[0].t)} and never moved. One of ${fmt(city.neverMoved)} men in the city still in the hands that booked them.`);
  } else out.push(`${cap(word(S.length))} hands in ${word(years)} years.`);

  const top = S.filter((s) => s.price != null).sort((a, b) => b.price - a.price)[0];
  if (top) {
    const day = Math.round((top.t - S[0].t) / 86400);
    const day0 = day === 0 ? 'on his first day' : day <= 30 ? `on day ${day + 1}`
      : `in ${new Date(top.t * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`;
    const when = m.crossed && top.t < m.crossed[0] ? ` in the Old City, ${day0}` : ` ${day0}`;
    const record = m.topRank === 1 ? ', the most anyone has ever paid for an Al Cabone' : '';
    const nxt = S[top.i + 1];
    let tail = `, and still holds him`;
    const later = top.days === 0 ? 'the same day' : `${span(top.days)} later`;
    if (nxt?.price != null) tail = `, and let him go ${later} for ${nxt.price < top.price ? 'less' : nxt.price > top.price ? 'more' : 'the same'}`;
    else if (nxt) tail = `, and handed him on ${later} with no sale on record`;
    out.push(`${who(top)} paid ${top.price} ETH for him${when}${record}${tail}.`);
  }
  // His double (m.double): the Old City's mint printed his number again after he crossed, and
  // the copy sold on (m.ghosts). Said gently: people lost money; no blame.
  if (m.ghosts.length || m.double) {
    const eth = +m.ghosts.reduce((a, g) => a + g[3], 0).toPrecision(3);
    const times = m.ghosts.length === 1 ? 'once' : `${word(m.ghosts.length)} times`;
    out.push(m.double
      ? `After he crossed, the Old City printed his papers again${m.ghosts.length ? `; his double changed hands ${times}, ${eth} ETH for a man who was already gone` : ''}.`
      : `After he crossed, his old papers were sold ${times} in the Old City: ${eth} ETH for a man who was already gone.`);
  } else if (m.crossed?.[1] === 'L') out.push(`He was never handed in; he came over on the last boat, ${date(m.crossed[0])}.`);
  const sweep = S.find((s) => s.sweep);
  if (sweep) out.push(`On ${date(sweep.t)} he was taken in a sweep of ${sweep.sweep}.`);
  const long = [...S].sort((a, b) => b.days - a.days)[0];
  if (!long.now && long.days >= 365 && S.length > 1) out.push(`His longest stretch: ${span(long.days)} with ${who(long)}.`);

  const now = S.at(-1);
  if (S.length > 1) {
    if (m.holderRank && m.holderRank <= 25) out.push(`Today he answers to No. ${m.holderRank} on the Bureau's list.`);
    // Only brag about a long hold when it beats most of the city (half never moved since 2021).
    else if (now.days >= 365 && m.pct.hold >= 50) out.push(`${who(now)} has held him ${span(now.days)}, longer than ${Math.floor(m.pct.hold)}% of the city.`);
    else if (now.days >= 365) out.push(`He's been with ${who(now)} ${span(now.days)}.`);
    else out.push(`Today he's with ${who(now)}.`);
  }
  return out.slice(0, 4).join(' ');
}

function Custody({ m, data, sheetRef }) {
  const asOfS = Math.floor(Date.parse(data.generatedAt) / 1000);
  const S = stints(m, asOfS);
  const people = data.people;
  const top = Math.max(0, ...S.map((s) => s.price ?? 0));
  const long = [...S].sort((a, b) => b.days - a.days)[0];
  const text = finding(m, S, people, data.city);
  const img = m.img.startsWith('http') ? m.img : data.imgPrefix + m.img;
  const filed = new Date(data.generatedAt).toLocaleDateString('en-US',
    { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
  return (
    <div className="cc" ref={sheetRef}>
      <style>{CSS}</style>
      <div className="hd"><span>THE BUREAU · EVIDENCE DIVISION</span><span>FILED {filed}</span></div>
      <h1>CHAIN OF CUSTODY</h1>
      <div className="sub"><b>EXHIBIT No. {m.id}</b>&nbsp; AL CABONES · ETHEREUM · BOOKED {date(S[0].t).toUpperCase()}</div>
      <div className="top">
        <div className="bag">
          <img src={img} crossOrigin="anonymous" alt="" />
          <div className="tag"><span>COLLECTION</span>Al Cabones<br /><span>TOKEN</span>#{m.id} of {fmt(data.supply)}<br />
            <span>CONTRACT</span>{CONTRACT}<br />{m.crossed && <><span>OLD CITY</span>{OLD_CONTRACT}<br /></>}<span>RARITY</span>#{fmt(m.rank)} (OpenSea)</div>
        </div>
        <div className="fd">
          <h3>BUREAU FINDING</h3>
          <p className={text.length > 260 ? 'long' : ''}>{text}</p>
          <div className="st">
            <div><b>{S.length}</b>{S.length === 1 ? 'HOLDER · NEVER MOVED' : 'HOLDERS SINCE MINT'}</div>
            {top ? <div><b>{top} ETH</b>{m.topRank === 1 ? 'TOP PRICE · THE HIGHEST EVER PAID IN THE CITY'
              : `TOP PRICE · HIGHER THAN ${Math.floor(m.pct.top)}% OF ALL SALES`}</div>
              : <div><b>NONE</b>NO SALE ON RECORD</div>}
            <div><b>{fmt(long.days)} DAYS</b>LONGEST STRETCH, WITH {person(long.to, people).name.toUpperCase()}</div>
          </div>
        </div>
      </div>
      <div className="log">
        <h3>CUSTODY LOG <span>WHO HELD HIM, FOR HOW LONG, AND HOW HE CHANGED HANDS</span></h3>
        {S.map((s) => {
          const p = person(s.to, people);
          const a = arrival(s);
          const sub = s.now ? (m.holderRank && m.holderRank <= 25 ? `No. ${m.holderRank} on the Most Wanted list · ${m.men} men`
            : `Holds ${m.men} Al Cabone${m.men === 1 ? '' : 's'}`) + (m.ask ? ` · listed at ${+m.ask.toPrecision(2)} ETH` : '') : p.sub;
          // The crossing sits under the stint that carried him across (same wallet both sides).
          const cx = m.crossed && s.t <= m.crossed[0] && (s.out == null || s.out > m.crossed[0]);
          return (<Fragment key={s.i}>
            <div className={s.now ? 'r now' : 'r'}>
              <div className="n">{s.i + 1}</div>
              {p.img ? <div className="ph" style={{ '--t': `${((s.i * 5) % 7) - 3}deg` }}><img src={p.img} crossOrigin="anonymous" alt="" /></div>
                : <div className="ph none" style={{ '--t': `${((s.i * 5) % 7) - 3}deg` }}>NO PHOTO<br />ON FILE</div>}
              <div className="who"><b>{p.name}</b>{p.x && <em>@{p.x}</em>}<div>{sub}</div>
                {s.now && <i className="stamp">IN CUSTODY</i>}</div>
              <div className="when"><b>{s.days === 0 ? 'Under a day' : `${fmt(s.days)} day${s.days === 1 ? '' : 's'}`}</b><br />
                {s.now ? `since ${date(s.t)}` : `${date(s.t)} – ${date(s.out)}`}</div>
              <div className="how"><b className={a.tone}>{a.head}</b>{a.sub}</div>
            </div>
            {cx && <div className="xing"><b>THE CROSSING · {date(m.crossed[0]).toUpperCase()}</b>
              {CROSSING[m.crossed[1]](p.name)}</div>}
          </Fragment>);
        })}
      </div>
      {(m.ghosts.length > 0 || m.double) && <div className="log gh">
        <h3>{m.double ? 'THE DOUBLE' : 'GHOST DEALS'} <span>{m.double
          ? `HIS NUMBER PRINTED AGAIN IN THE OLD CITY, ${date(m.double).toUpperCase()}, AFTER HE HAD LEFT`
          : 'SOLD IN THE OLD CITY AFTER HE HAD ALREADY LEFT'}</span></h3>
        {m.ghosts.slice(0, 5).map((g, i) => (
          <div key={i} className="g"><span>{date(g[0])}</span><b>{person(g[2], people).name}</b>
            <span>paid {g[3]} ETH for {m.double ? 'the double' : 'his old papers'}</span></div>
        ))}
        {m.ghosts.length > 5 && <div className="g"><span /><span>…and {m.ghosts.length - 5} more</span></div>}
      </div>}
      <div className="ft"><span>Source: Ethereum transfer log · OpenSea sales and public profiles. “No sale on record” = moved
        without a sale on OpenSea. Old City = the first Al Cabones contract, before the 2021 recall.</span><b>ALCABONEFILES.XYZ/FILE/{m.id}</b></div>
    </div>
  );
}

export default function FilePage({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [num, setNum] = useState(id ?? '');
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!document.querySelector(`link[href="${FONTS}"]`)) {
      const l = document.createElement('link');
      Object.assign(l, { rel: 'stylesheet', href: FONTS, crossOrigin: 'anonymous' });
      document.head.appendChild(l);
    }
    document.title = id ? `Al Cabone #${id}: chain of custody · alcabonefiles` : 'Chain of custody · alcabonefiles';
    const onResize = () => setScale(Math.min(1, (window.innerWidth - 32) / W));
    onResize();
    window.addEventListener('resize', onResize);
    if (id) {
      (async () => {
        try {
          const res = await fetch(`${FILES_DIR}/${String(Math.floor(Number(id) / 100)).padStart(2, '0')}.json`,
            { cache: 'no-cache' });
          const d = res.ok ? await res.json() : null;
          const m = d?.men[String(Number(id))];
          if (!m) throw new Error(`The Bureau has no file on #${id}.`);
          setData({ d, m });
        } catch (e) { setError(e.message); }
      })();
    }
    return () => window.removeEventListener('resize', onResize);
  }, [id]);

  const [height, setHeight] = useState(1500);
  useEffect(() => {
    // The sheet grows with the log and settles once fonts and pictures load: follow it.
    if (!sheetRef.current) return undefined;
    const ro = new ResizeObserver(() => setHeight(sheetRef.current.offsetHeight));
    ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, [data]);

  const pull = (e) => {
    e.preventDefault();
    const n = Number(num);
    if (num !== '' && Number.isInteger(n)) window.location.assign(`/file/${n}`);
  };
  const download = async () => {
    setBusy(true);
    try {
      const url = await toPng(sheetRef.current, { width: W, height: sheetRef.current.offsetHeight, pixelRatio: 1 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `al-cabone-${id}-chain-of-custody.png`;
      a.click();
    } catch (e) { setError(`PNG failed: ${e.message || e}`); }
    setBusy(false);
  };

  const type = { fontFamily: "'Special Elite', monospace", fontSize: 14, letterSpacing: 2 };
  const btn = { ...type, padding: '9px 16px', border: '1px solid #b9ad92', background: '#151311', color: '#efe6d2',
    cursor: 'pointer', textDecoration: 'none' };
  return (
    <div style={{ minHeight: '100vh', background: '#151311', color: '#efe6d2', padding: 16 }}>
      <div style={{ maxWidth: W, margin: '0 auto 16px', display: 'flex', gap: 12, flexWrap: 'wrap',
                    alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/most-wanted" style={btn}>← THE MOST WANTED LIST</a>
          {data?.m.holderRank && <a href={`/most-wanted/${data.m.holder}`} style={btn}>← HIS FAMILY CHART</a>}
        </div>
        <form onSubmit={pull} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="num" style={type}>PULL THE FILE ON AL CABONE #</label>
          <input id="num" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, ''))} inputMode="numeric"
                 maxLength={5} style={{ ...btn, width: 100, cursor: 'text' }} />
          <button type="submit" style={btn}>PULL</button>
        </form>
        {data && <button type="button" onClick={download} disabled={busy} style={btn}>
          {busy ? 'DEVELOPING…' : 'DOWNLOAD PNG'}</button>}
      </div>
      {!id && <p style={{ ...type, textAlign: 'center', color: '#b9ad92' }}>
        Every man in the city has a file: who held him, for how long, and what they paid. Give the Bureau a number.</p>}
      {error && <p style={{ ...type, textAlign: 'center' }}>{error}</p>}
      {id && !data && !error && <p style={{ ...type, textAlign: 'center' }}>Pulling the file…</p>}
      {data && (
        <div style={{ width: W * scale, height: height * scale, margin: '0 auto', overflow: 'hidden' }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: W }}>
            <Custody m={data.m} data={data.d} sheetRef={sheetRef} />
          </div>
        </div>
      )}
    </div>
  );
}

// Aged evidence form; the mock's stylesheet, scoped. Height grows with the log (min 1500).
const CSS = `
.cc{position:relative;width:${W}px;min-height:1500px;padding-bottom:110px;background:#ece4d0;color:#24201a;font-family:'Special Elite',monospace;overflow:hidden;text-align:left}
.cc *{margin:0;box-sizing:border-box}
.cc:before{content:'';position:absolute;inset:0;z-index:9;pointer-events:none;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.cc .hd{padding:46px 60px 0;display:flex;justify-content:space-between;font-size:17px;letter-spacing:2px;color:#5d5241}
.cc h1{font-family:Oswald;font-weight:700;font-size:118px;letter-spacing:6px;line-height:1;padding:10px 56px 0}
.cc .sub{padding:6px 60px 0;font-size:20px;letter-spacing:3px}
.cc .sub b{background:#8f2a22;color:#efe4cc;padding:2px 10px;font-weight:400}
.cc .top{display:flex;gap:44px;padding:26px 60px 0}
.cc .bag{position:relative;width:410px;flex:none;padding:46px 18px 18px;background:linear-gradient(135deg,rgba(255,255,255,.55),rgba(255,255,255,.25));border:2px solid rgba(80,70,55,.35);border-radius:6px;box-shadow:0 8px 18px rgba(0,0,0,.18);transform:rotate(-1.5deg)}
.cc .bag:before{content:'EVIDENCE';position:absolute;top:0;left:0;right:0;height:32px;background:#8f2a22;color:#efe4cc;font-family:Oswald;font-weight:700;letter-spacing:10px;font-size:20px;text-align:center;line-height:32px;border-radius:4px 4px 0 0}
.cc .bag img{display:block;width:372px;height:372px;max-width:none;object-fit:cover;background:#999}
.cc .tag{margin-top:12px;font-size:14px;line-height:1.55;letter-spacing:.5px}
.cc .tag span{display:inline-block;width:118px;color:#6a5d48}
.cc .fd{flex:1;padding-top:6px}
.cc .fd h3{font-family:Oswald;font-weight:700;font-size:20px;letter-spacing:5px;color:#8f2a22;border-bottom:2px solid #3a3228;padding-bottom:4px}
.cc .fd p{font-family:'Old Standard TT',serif;font-size:30px;line-height:1.28;margin-top:16px}
.cc .fd p.long{font-size:25px}
.cc .st{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:22px}
.cc .st div{border:2px solid #3a3228;padding:10px 12px;font-size:13px;letter-spacing:1px;color:#5d5241;line-height:1.3;overflow-wrap:anywhere}
.cc .st b{display:block;font-family:Oswald;font-weight:700;font-size:32px;letter-spacing:1px;color:#24201a;line-height:1.15}
.cc .log{margin:22px 60px 0}
.cc .log h3{font-family:Oswald;font-weight:700;font-size:20px;letter-spacing:5px;border-bottom:2px solid #3a3228;padding-bottom:4px;display:flex;justify-content:space-between}
.cc .log h3 span{font-family:'Special Elite';font-weight:400;font-size:14px;letter-spacing:1px;color:#6a5d48;padding-top:6px}
.cc .r{position:relative;display:grid;grid-template-columns:34px 78px 1fr 210px 250px;gap:16px;align-items:center;padding:8px 0;border-bottom:1px dashed #9b8f78}
.cc .r .n{font-family:Oswald;font-size:26px;color:#8a7d66}
.cc .r .ph{width:72px;height:72px;border:4px solid #f6f1e4;box-shadow:0 2px 5px rgba(0,0,0,.25);background:#b9b09c;overflow:hidden;transform:rotate(var(--t,0deg))}
.cc .r .ph img{width:100%;height:100%;max-width:none;object-fit:cover;filter:grayscale(.15)}
.cc .r .ph.none{display:flex;align-items:center;justify-content:center;font-size:9px;text-align:center;letter-spacing:1px;color:#4d4436;line-height:1.2}
.cc .r .who{min-width:0}
.cc .r .who b{font-family:'Old Standard TT',serif;font-size:25px;overflow-wrap:anywhere}
.cc .r .who em{font-style:normal;color:#1f4f8a;margin-left:8px;font-size:17px}
.cc .r .who div{font-size:14px;color:#6a5d48;margin-top:2px}
.cc .r .when{font-size:15px;line-height:1.45}
.cc .r .when b{font-family:Oswald;font-weight:500;font-size:19px}
.cc .r .how{font-size:15px;line-height:1.35}
.cc .r .how b{display:block;font-family:Oswald;font-weight:700;font-size:20px;letter-spacing:1px}
.cc .r .how .up{color:#2e6b3a}.cc .r .how .dn{color:#8f2a22}
.cc .r.now{background:rgba(143,42,34,.07)}
.cc .r .stamp{display:inline-block;margin-top:6px;border:3px solid #8f2a22;color:#8f2a22;font-family:Oswald;font-weight:700;font-style:normal;font-size:15px;letter-spacing:4px;padding:0 10px;transform:rotate(-3deg);opacity:.9}
.cc .xing{padding:10px 0 10px 50px;border-bottom:1px dashed #9b8f78;font-size:15px;color:#4d4436;background:repeating-linear-gradient(90deg,rgba(143,42,34,.06) 0 14px,transparent 14px 28px)}
.cc .xing b{font-family:Oswald;font-weight:700;letter-spacing:4px;color:#8f2a22;margin-right:14px;font-size:17px}
.cc .gh .g{display:grid;grid-template-columns:160px 1fr 330px;gap:16px;padding:6px 0;border-bottom:1px dashed #9b8f78;font-size:15px;color:#4d4436}
.cc .gh .g b{font-family:'Old Standard TT',serif;font-size:20px;color:#24201a}
.cc .ft{position:absolute;left:60px;right:60px;bottom:40px;display:flex;justify-content:space-between;gap:24px;font-size:14px;letter-spacing:1px;color:#5d5241;border-top:2px solid #3a3228;padding-top:10px}
.cc .ft b{font-family:Oswald;font-size:18px;letter-spacing:3px;color:#24201a;white-space:nowrap}
`;
