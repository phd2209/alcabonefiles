import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';

/**
 * WantedPoster — one man off a family chart, as the Bureau's wanted poster (Toni, 5 Oct).
 * Everything on it is what the chart already says about him (name, rarity, charges, note,
 * position), from the published <date>-charts.json; no API calls. Rendered to a 1200×1500
 * PNG with html-to-image, like the chart.
 */

const PW = 1200, PH = 1500;
const fmt = (n) => n.toLocaleString('en-US');

export default function WantedPoster({ m, name, role, color, img, supply, codes, family, rank, wallet, date, onClose }) {
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
  const charges = m.codes.map((c) => codes[c - 1]);
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
            <div className="wp" ref={ref} style={{ '--fc': color }}>
              <style>{CSS}</style>
              <div className="hd">THE BUREAU · SYNDICATE CITY FIELD OFFICE</div>
              <h1>WANTED</h1>
              <div className="rule" />
              <div className="ph">
                <i className="tp l" /><i className="tp r" />
                <img src={img} crossOrigin="anonymous" alt="" />
              </div>
              <div className="stamp">{role.title}</div>
              <h2>{first} &ldquo;{nick}&rdquo; {last}</h2>
              <div className="tx">
                <div>FBI #{m.id} · OPENSEA RARITY #{fmt(m.rank)} OF {fmt(supply)}</div>
                <div>FAMILY: {m.family.toUpperCase()}</div>
                <div>POSITION: {role.title}{role.where ? `, ${role.where}` : ''}</div>
                <div>CREW: THE {family.toUpperCase()} FAMILY · MOST WANTED #{rank}</div>
                <div className="ch">CHARGES: {charges.length ? charges.join(' · ') : 'NONE ON FILE. YET.'}</div>
                {m.note && <div className="nt">{m.note}</div>}
              </div>
              <div className="stain" />
              <div className="fo">
                <span>LAST SEEN: {wallet.slice(0, 6)}…{wallet.slice(-4)}</span>
                <span>ALCABONEFILES.XYZ/MOST-WANTED · {date}</span>
              </div>
              <div className="ca">APPROACH WITH CAUTION · ARMED AND DANGEROUS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Aged manila, typewriter, red ink; the photo is a polaroid like the chart's, in the family colour.
const CSS = `
.wp{width:${PW}px;height:${PH}px;position:relative;overflow:hidden;background:#d7c49e;color:#1b1b1b;font-family:'Special Elite',monospace;text-align:center}
.wp *{margin:0;box-sizing:border-box}
.wp:before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .25 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:5}
.wp:after{content:'';position:absolute;inset:28px;border:5px double #6e5a3e;pointer-events:none}
.wp .hd{padding-top:66px;font-size:26px;letter-spacing:5px;color:#4a3d2a}
.wp h1{font-family:Oswald,sans-serif;font-weight:700;font-size:200px;line-height:1;letter-spacing:24px;padding-left:24px;color:#9b2f2f;margin-top:8px}
.wp .rule{width:1000px;height:4px;background:#9b2f2f;margin:14px auto 0}
.wp .ph{position:relative;width:500px;margin:44px auto 0;background:#f4eedb;padding:14px 14px 18px;border-bottom:12px solid var(--fc);transform:rotate(-1.2deg);box-shadow:0 10px 22px rgba(0,0,0,.3)}
.wp .ph img{display:block;width:472px;height:472px;object-fit:cover;background:#999;max-width:none}
.wp .tp{position:absolute;top:-16px;width:100px;height:30px;background:rgba(235,228,205,.78);box-shadow:0 1px 2px rgba(0,0,0,.15)}
.wp .tp.l{left:-26px;transform:rotate(-24deg)}.wp .tp.r{right:-26px;transform:rotate(24deg)}
.wp .stamp{position:absolute;top:440px;right:70px;border:6px solid #9b2f2f;color:#9b2f2f;font-family:Oswald,sans-serif;font-weight:700;font-size:44px;letter-spacing:4px;padding:2px 18px;transform:rotate(-9deg);opacity:.85}
.wp h2{font-family:Oswald,sans-serif;font-weight:700;font-size:68px;letter-spacing:2px;text-transform:uppercase;margin-top:38px;line-height:1.1;padding:0 70px}
.wp .tx{margin:22px auto 0;width:1000px;font-size:28px;line-height:1.6;letter-spacing:.5px}
.wp .ch{margin-top:6px;color:#9b2f2f;font-weight:700}
.wp .nt{margin-top:4px;font-weight:700}
.wp .stain{position:absolute;right:40px;bottom:70px;width:200px;height:150px;border-radius:50%;background:radial-gradient(#4a352018,#4a35200c 45%,transparent 70%)}
.wp .fo{position:absolute;left:70px;right:70px;bottom:92px;display:flex;justify-content:space-between;font-size:20px;letter-spacing:1px;color:#4a3d2a}
.wp .ca{position:absolute;left:0;right:0;bottom:50px;font-size:17px;letter-spacing:3px;color:#6e5a3e}
`;
