import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';

/**
 * WantedPoster — one man off a family chart, as a 1934 Bureau Identification Order with the
 * "Public Enemy" rank on top (Toni, 5 Oct; sample: burn-the-ships/out/poster-io-villa.html).
 * Everything on it comes from the published <date>-charts.json (name, rarity, charges, note,
 * traits, position); no API calls. Rendered to a 1200×1500 PNG with html-to-image, like the chart.
 */

const PW = 1200, PH = 1500;
const fmt = (n) => n.toLocaleString('en-US');
const cap = (s) => s[0].toUpperCase() + s.slice(1).toLowerCase();
const words = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// The description, in the order of a 1934 order. Base values are left out of the charts file.
const DESC = [['SKULL', 'Skull'], ['HEAD', 'Head'], ['EYES', 'Eyes'], ['FACIAL HAIR', 'Facial Hair'],
  ['CLOTHES', 'Clothes'], ['WEAPON', 'Weapon'], ['SCARS, MARKS', 'Mouth']];

// Exactly one joke per poster, picked by token number; the rest plays it straight (Toni, 5 Oct).
// 6474 (Villa's boss) % 6 = 0, so Villa keeps ALL BONE: keep the pool at 6 or recheck that.
const JOKES = [
  { at: 'prints', text: 'NO PRINTS · SUBJECT IS ALL BONE' },
  { at: 'desc', label: 'WEIGHT', text: 'Light. Mostly calcium.' },
  { at: 'desc', label: 'COMPLEXION', text: 'Pale. Very.' },
  { at: 'reward', text: 'Reward: none offered. Nobody talks.' },
  { at: 'desc', label: 'BLOOD TYPE', text: 'None found.' },
  { at: 'desc', label: 'OCCUPATION', text: 'Says he is in waste management.' },
];

const FINGERS = ['R. THUMB', 'R. INDEX', 'R. MIDDLE', 'R. RING', 'R. LITTLE',
  'L. THUMB', 'L. INDEX', 'L. MIDDLE', 'L. RING', 'L. LITTLE'];

export default function WantedPoster({ m, name, role, img, supply, codes, family, rank, men, families, date, onClose }) {
  const [first, last, nick] = name;
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onResize = () => setScale(Math.min(1, (window.innerWidth - 32) / PW, (window.innerHeight - 90) / PH));
    const onKey = (e) => e.key === 'Escape' && onClose();
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const download = async () => {
    setBusy(true);
    try {
      const url = await toPng(ref.current, { width: PW, height: PH, pixelRatio: 1 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${first}-${last}-wanted-${m.id}.png`.toLowerCase();
      a.click();
    } catch (e) { setError(`PNG failed: ${e.message || e}`); }
    setBusy(false);
  };

  const btn = { fontFamily: "'Special Elite', monospace", fontSize: 14, letterSpacing: 2, padding: '9px 16px',
    border: '1px solid #b9ad92', background: '#151311', color: '#efe6d2', cursor: 'pointer' };
  const joke = JOKES[Number(m.id) % JOKES.length];
  const desc = [['FAMILY', m.family], ...DESC.filter(([, k]) => m.traits?.[k]).map(([l, k]) => [l, cap(m.traits[k])])];
  if (joke.at === 'desc') desc.push([joke.label, joke.text]);
  const charges = m.codes.map((c) => cap(codes[c - 1])).join('. ');
  const day = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US',
    { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
  const who = role.title === 'BOSS'
    ? `Boss of the ${family} family, ${men} men in ${families === 7 ? 'all seven families' : `${families} of 7 families`}.`
    : `${cap(role.title)} of the ${family} family${role.where ? `, ${words(role.where).replace(/ Regime$/, ' regime')}` : ''}.`;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(10,9,8,.88)',
                                    overflowY: 'auto', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: PW * scale, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={onClose} style={btn}>← BACK TO THE CHART</button>
          <button type="button" onClick={download} disabled={busy} style={btn}>{busy ? 'DEVELOPING…' : 'DOWNLOAD PNG'}</button>
        </div>
        {error && <p style={{ color: '#efe6d2', fontFamily: 'monospace' }}>{error}</p>}
        <div style={{ width: PW * scale, height: PH * scale, overflow: 'hidden' }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: PW }}>
            <div className="io" ref={ref}>
              <style>{CSS}</style>
              <div className="frame" />
              <div className="fold" />
              <div className="top"><span>IDENTIFICATION ORDER No. {m.id}</span><span>{day}</span></div>
              <div className="dept">THE BUREAU · SYNDICATE CITY FIELD OFFICE</div>
              <h1>WANTED</h1>
              <div className="pe"><span>PUBLIC ENEMY No. {rank}</span></div>

              <div className="photo">
                <img className="img" src={img} crossOrigin="anonymous" alt="" />
                <div className="cap"><span>AL CABONE #{m.id}</span><span>OPENSEA RARITY #{fmt(m.rank)} OF {fmt(supply)}</span></div>
              </div>
              <div className="mug"><img src={img} crossOrigin="anonymous" alt="" /><i>BOOKED 2021</i></div>

              <div className="who">
                <h2>{first}<br />&ldquo;{nick}&rdquo; {last}</h2>
                <div className="ak">{who}</div>
                <div className="desc">{desc.map(([l, v]) => [<b key={l}>{l}</b>, <span key={`${l}v`}>{v}</span>])}</div>
              </div>

              <div className="rec">
                <h3>CRIMINAL RECORD</h3>
                <div className="ch">{charges ? `${charges}.` : 'No charges on file.'}</div>
                {m.note && <div>Bureau note: {m.note}.</div>}
              </div>

              <div className="fp">
                <h3>FINGERPRINTS</h3>
                <div className="row">{FINGERS.map((f, i) => <div key={f}>{i + 1}. {f}</div>)}</div>
                {joke.at === 'prints' && <div className="stamp">{joke.text}</div>}
              </div>

              <div className="bot">
                <div className="sig"><div className="s">{first} {last}</div>SIGNATURE OF SUBJECT</div>
                <div className="notice"><b>APPROACH WITH CAUTION</b>
                  {joke.at === 'reward' ? <>{joke.text}<br /></> : <>Information to the Bureau, Syndicate City.<br /></>}
                  ALCABONEFILES.XYZ/MOST-WANTED</div>
                <div className="dir"><div className="s">The Director</div>DIRECTOR, THE BUREAU</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Aged paper folded for the mail, typewriter, one red band; the sample's stylesheet, scoped.
const CSS = `
.io{position:relative;width:${PW}px;height:${PH}px;overflow:hidden;background:#e6dcc3;color:#26221c;font-family:'Special Elite',monospace;text-align:left}
.io *{margin:0;box-sizing:border-box}
.io:before{content:'';position:absolute;inset:0;z-index:9;pointer-events:none;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .28 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.io:after{content:'';position:absolute;inset:0;z-index:8;pointer-events:none;background:
  radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(90,60,20,.28)),
  radial-gradient(circle at 88% 9%,rgba(120,80,30,.13),transparent 9%),
  radial-gradient(circle at 7% 93%,rgba(120,80,30,.12),transparent 11%)}
.io .fold{position:absolute;left:0;right:0;top:748px;height:6px;z-index:10;background:linear-gradient(rgba(0,0,0,.10),rgba(255,255,255,.35) 50%,rgba(0,0,0,.08))}
.io .frame{position:absolute;inset:26px;border:2px solid #3a3228;outline:1px solid #3a3228;outline-offset:5px}
.io .top{position:absolute;top:50px;left:60px;right:60px;display:flex;justify-content:space-between;font-size:19px;letter-spacing:2px}
.io .dept{position:absolute;top:84px;left:0;right:0;text-align:center;font-family:'Old Standard TT',serif;font-size:21px;letter-spacing:6px}
.io h1{position:absolute;top:110px;left:0;right:0;text-align:center;font-family:'Alfa Slab One',serif;font-weight:400;font-size:208px;line-height:1;letter-spacing:10px;color:#211d18}
.io .pe{position:absolute;top:330px;left:0;right:0;text-align:center}
.io .pe span{display:inline-block;background:#8f2a22;color:#efe4cc;font-family:Oswald,sans-serif;font-weight:700;font-size:50px;letter-spacing:9px;padding:4px 34px 6px 43px}
.io .photo{position:absolute;top:426px;left:64px;width:520px}
.io .photo .img{display:block;width:520px;height:520px;max-width:none;object-fit:cover;background:#999;border:3px solid #2b261f;filter:sepia(.18) contrast(1.05)}
.io .photo .cap{display:flex;justify-content:space-between;font-size:15px;letter-spacing:1px;margin-top:6px}
.io .mug{position:absolute;top:392px;left:30px;width:150px;height:150px;border:6px solid #f2ecdc;box-shadow:0 4px 10px rgba(0,0,0,.3);transform:rotate(-6deg);z-index:6;background:#f2ecdc}
.io .mug img{display:block;width:138px;height:138px;max-width:none;object-fit:cover;background:#999;filter:grayscale(1) contrast(1.35) brightness(1.05)}
.io .mug i{position:absolute;bottom:-26px;left:-6px;right:-6px;text-align:center;font-style:normal;font-size:12px;letter-spacing:1px;background:#f2ecdc;padding:3px 0}
.io .who{position:absolute;top:426px;left:620px;right:64px}
.io .who h2{font-family:'Old Standard TT',serif;font-weight:700;font-size:52px;line-height:1.02;letter-spacing:1px;text-transform:uppercase}
.io .who .ak{margin-top:12px;font-size:19px;line-height:1.45}
.io .desc{margin-top:16px;border-top:2px solid #3a3228;padding-top:12px;display:grid;grid-template-columns:150px 1fr;row-gap:4px;font-size:20px;line-height:1.3}
.io .desc b{font-weight:400;color:#6a5d48;letter-spacing:1px;font-size:16px;padding-top:3px}
.io .rec{position:absolute;top:1052px;left:64px;right:64px;font-size:20px;line-height:1.5}
.io .rec h3,.io .fp h3{font-family:'Old Standard TT',serif;font-weight:700;font-size:20px;letter-spacing:4px;border-bottom:2px solid #3a3228;margin-bottom:8px;padding-bottom:2px}
.io .rec .ch{color:#8f2a22}
.io .fp{position:absolute;top:1206px;left:64px;right:64px}
.io .fp .row{display:grid;grid-template-columns:repeat(10,1fr);border:2px solid #3a3228}
.io .fp .row div{height:96px;border-left:1px solid #3a3228;font-size:11px;letter-spacing:.5px;padding:4px 5px;color:#6a5d48}
.io .fp .row div:first-child{border-left:0}
.io .fp .stamp{position:absolute;top:58px;left:50%;transform:translateX(-50%) rotate(-4deg);border:5px solid #8f2a22;color:#8f2a22;font-family:Oswald,sans-serif;font-weight:700;font-size:34px;letter-spacing:5px;padding:2px 22px;white-space:nowrap;opacity:.88;background:rgba(230,220,195,.35)}
.io .bot{position:absolute;top:1362px;left:64px;right:64px;display:flex;justify-content:space-between;align-items:flex-end}
.io .sig{min-width:270px;font-size:13px;letter-spacing:1px}
.io .sig .s{font-family:Caveat,cursive;font-size:46px;line-height:1;border-bottom:1.5px solid #3a3228;padding:0 8px 2px;color:#1f2b4a;white-space:nowrap}
.io .notice{flex:1;padding:0 28px;font-size:14px;line-height:1.45;text-align:center}
.io .notice b{display:block;font-family:Oswald,sans-serif;font-size:21px;letter-spacing:4px;color:#8f2a22}
.io .dir{width:270px;text-align:right;font-size:13px;letter-spacing:1px}
.io .dir .s{font-family:Caveat,cursive;font-size:40px;line-height:1;color:#1f2b4a;transform:rotate(-3deg)}
`;
