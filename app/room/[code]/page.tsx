'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase, RoomResult } from '@/lib/supabase';
import BingoGame from '@/components/BingoGame';

// ─── Design tokens ───────────────────────────────────────────────────────────
const G = {
  void:      '#050507',
  abyss:     '#080810',
  jet:       '#111119',
  slate:     '#16161f',
  gunmetal:  '#1c1c28',
  iron:      '#232333',
  steel:     '#2d2d42',
  bolt:      '#3a3a52',
  dim:       '#5a5a7a',
  chrome:    '#8888a8',
  silver:    '#b8b8d0',
  ivory:     '#e8e6e0',
  white:     '#f4f2ec',
  goldDim:   '#6a5520',
  gold:      '#a8832a',
  goldMid:   '#c9a84c',
  goldLight: '#e8c96a',
  goldSheen: '#f5dfa0',
  red:       '#e8002d',
  redDeep:   '#9b001e',
  redGlow:   '#ff1744',
  redLo:     '#2a0008',
  green:     '#00d68f',
  amber:     '#f5a623',
  blue:      '#2979ff',
  blueGlow:  '#448aff',
} as const;

const FD = "var(--font-display,'Bebas Neue',sans-serif)";
const FE = "var(--font-editorial,'Cormorant Garamond',Georgia,serif)";
const FM = "var(--font-mono,'Barlow Condensed','Arial Narrow',sans-serif)";

// ─── Shared CSS injected per-page ─────────────────────────────────────────────
const STYLES = `
@keyframes fadeUp    { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn    { from{opacity:0}to{opacity:1} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes pulseDot  { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.65)} }
@keyframes rowIn     { from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)} }
@keyframes countPop  { 0%{transform:scale(1.6);opacity:0}60%{transform:scale(.9)}100%{transform:scale(1);opacity:1} }
@keyframes glowPulse { 0%,100%{text-shadow:0 0 10px rgba(201,168,76,.2)}50%{text-shadow:0 0 28px rgba(201,168,76,.55)} }
@keyframes shimmer   { 0%{background-position:-500px 0}100%{background-position:500px 0} }

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
input:focus  { outline:none; }
a            { text-decoration:none; color:inherit; }
button       { font-family:inherit; cursor:pointer; transition:all 0.18s ease; }

/* Scanline overlay (subtle CRT effect on top of bg) */
.scanlines {
  position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden;
  background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.012) 50%);
  background-size: 100% 3px;
}

/* Panel */
.panel {
  background: linear-gradient(155deg, ${G.gunmetal} 0%, ${G.jet} 60%, ${G.slate} 100%);
  border: 1px solid ${G.bolt};
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 48px rgba(0,0,0,0.88);
  position: relative; overflow: hidden;
}
.panel-gold-top::before {
  content:''; display:block; height:1px;
  background: linear-gradient(90deg, transparent, ${G.goldDim} 20%, ${G.goldMid} 50%, ${G.goldDim} 80%, transparent);
}
.panel-red-top::before {
  content:''; display:block; height:2px;
  background:${G.red}; box-shadow:0 0 14px rgba(232,0,45,.8);
}
.cornered::after {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    linear-gradient(to right,  ${G.goldDim} 0,${G.goldDim} 10px,transparent 10px) top    left  /11px 1px no-repeat,
    linear-gradient(to bottom, ${G.goldDim} 0,${G.goldDim} 10px,transparent 10px) top    left  /1px 11px no-repeat,
    linear-gradient(to left,   ${G.goldDim} 0,${G.goldDim} 10px,transparent 10px) top    right /11px 1px no-repeat,
    linear-gradient(to bottom, ${G.goldDim} 0,${G.goldDim} 10px,transparent 10px) top    right /1px 11px no-repeat,
    linear-gradient(to right,  ${G.goldDim} 0,${G.goldDim} 10px,transparent 10px) bottom left  /11px 1px no-repeat,
    linear-gradient(to top,    ${G.goldDim} 0,${G.goldDim} 10px,transparent 10px) bottom left  /1px 11px no-repeat,
    linear-gradient(to left,   ${G.goldDim} 0,${G.goldDim} 10px,transparent 10px) bottom right /11px 1px no-repeat,
    linear-gradient(to top,    ${G.goldDim} 0,${G.goldDim} 10px,transparent 10px) bottom right /1px 11px no-repeat;
  opacity:.5;
}

/* Buttons */
.btn-red {
  display:flex; align-items:center; justify-content:center; gap:9px;
  width:100%; padding:15px 0;
  font-family:${FM}; font-weight:900; font-size:0.9rem;
  letter-spacing:0.2em; text-transform:uppercase;
  color:${G.white}; background:${G.red}; border:none;
  clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
  box-shadow:0 0 26px rgba(232,0,45,.35),inset 0 1px 0 rgba(255,255,255,.1);
  position:relative; overflow:hidden;
}
.btn-red::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);
  transform:translateX(-100%); transition:transform 0.5s;
}
.btn-red:hover::after { transform:translateX(100%); }
.btn-red:hover  { box-shadow:0 0 48px rgba(232,0,45,.65),inset 0 1px 0 rgba(255,255,255,.14); transform:translateY(-1px); }
.btn-red:disabled { opacity:.45; cursor:not-allowed; transform:none; }

.btn-gold {
  padding:11px 24px;
  font-family:${FM}; font-weight:800; font-size:0.82rem;
  letter-spacing:0.2em; text-transform:uppercase;
  background:rgba(201,168,76,.06); border:1px solid ${G.goldDim}; color:${G.goldMid};
}
.btn-gold:hover { background:rgba(201,168,76,.12); border-color:${G.goldMid}; color:${G.goldLight}; }

.btn-ghost {
  padding:10px 22px;
  font-family:${FM}; font-weight:700; font-size:0.78rem;
  letter-spacing:0.18em; text-transform:uppercase;
  background:transparent; border:1px solid ${G.bolt}; color:${G.chrome};
}
.btn-ghost:hover { color:${G.ivory}; border-color:${G.steel}; background:rgba(255,255,255,.025); }

/* Label */
.lbl {
  font-family:${FM}; font-weight:700; font-size:0.58rem;
  letter-spacing:0.32em; color:${G.goldDim}; text-transform:uppercase;
  display:flex; align-items:center; gap:8px; margin-bottom:8px;
}
.lbl::before { content:''; display:inline-block; width:14px; height:1px; background:${G.goldDim}; }

/* Input */
input.field {
  width:100%; padding:13px 16px;
  font-family:${FM}; font-weight:700; font-size:1rem; letter-spacing:0.12em;
  background:${G.abyss}; border:1px solid ${G.bolt}; color:${G.ivory};
  transition:border-color 0.15s, box-shadow 0.15s;
}
input.field:focus { border-color:${G.goldDim}; box-shadow:0 0 0 3px rgba(168,131,42,.07); }
input.field::placeholder { color:${G.dim}; font-weight:400; }

/* Stat pill */
.stat-pill {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:10px 18px; min-width:72px;
  background:${G.abyss}; border:1px solid ${G.bolt};
}

/* Table row hover */
.trow { transition:background 0.2s; }
.trow:hover { background:rgba(255,255,255,.015) !important; }

/* Skeleton */
.sk {
  background:linear-gradient(90deg,${G.iron} 25%,${G.gunmetal} 50%,${G.iron} 75%);
  background-size:500px 100%; animation:shimmer 1.6s infinite;
}

/* Animation helpers */
.fade-up   { animation:fadeUp   0.55s cubic-bezier(0.16,1,0.3,1) both; }
.row-in    { animation:rowIn    0.35s cubic-bezier(0.16,1,0.3,1) both; }
.count-pop { animation:countPop 0.5s  cubic-bezier(0.34,1.56,0.64,1) both; }
`;

// ─── helpers ────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

// ─── Background ──────────────────────────────────────────────────────────────
function Bg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,0,45,0.05) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 90% 5%,  rgba(201,168,76,0.04) 0%, transparent 60%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(201,168,76,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.025) 1px,transparent 1px)`,
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 20%, transparent 100%)',
      }} />
    </div>
  );
}

// ─── F1 Badge ────────────────────────────────────────────────────────────────
function F1Badge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const badgeFs = size === 'sm' ? '0.9rem'  : size === 'lg' ? '2.2rem'  : '1.5rem';
  const bingoFs = size === 'sm' ? '1.3rem'  : size === 'lg' ? '3rem'    : '2rem';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <span style={{ fontFamily: FD, fontSize: badgeFs, lineHeight: 1, color: G.white, position: 'relative', zIndex: 1, padding: '0 0.15em' }}>F1</span>
        <div style={{
          position: 'absolute', inset: '3px 0',
          background: G.red, clipPath: 'polygon(8% 0%,100% 0%,92% 100%,0% 100%)',
          zIndex: 0, boxShadow: `0 0 20px rgba(232,0,45,0.45)`,
        }} />
      </div>
      <span style={{
        fontFamily: FD, fontSize: bingoFs, lineHeight: 1, letterSpacing: '0.1em',
        background: `linear-gradient(135deg,${G.goldSheen} 0%,${G.goldLight} 35%,${G.goldMid} 70%,${G.gold} 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>BINGO</span>
    </div>
  );
}

// ─── QR Code ─────────────────────────────────────────────────────────────────
function QRCode({ url, size = 150 }: { url: string; size?: number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(url)}&bgcolor=080810&color=c9a84c&margin=1&qzone=1`;
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `1px solid ${G.goldDim}`,
      background: G.abyss, position: 'relative', overflow: 'hidden',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="QR" width={size} height={size} style={{ display: 'block' }} />
      {/* Corner brackets */}
      {[
        { top: 0,    left: 0,    borderWidth: '2px 0 0 2px' } as React.CSSProperties,
        { top: 0,    right: 0,   borderWidth: '2px 2px 0 0' } as React.CSSProperties,
        { bottom: 0, left: 0,    borderWidth: '0 0 2px 2px' } as React.CSSProperties,
        { bottom: 0, right: 0,   borderWidth: '0 2px 2px 0' } as React.CSSProperties,
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 12, height: 12, borderColor: G.goldMid, borderStyle: 'solid', ...s }} />
      ))}
    </div>
  );
}

// ─── Share Panel ──────────────────────────────────────────────────────────────
function SharePanel({ code, showQR = true }: { code: string; showQR?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [url,    setUrl]    = useState(`/room/${code}`);

  useEffect(() => { setUrl(`${window.location.origin}/room/${code}`); }, [code]);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  }

  return (
    <div className="panel panel-gold-top cornered fade-up" style={{ marginBottom: 12 }}>
      <div style={{ padding: '20px 24px', display: 'flex', gap: 22, alignItems: 'stretch', flexWrap: 'wrap' }}>

        {showQR && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <QRCode url={url} size={136} />
            <span style={{ fontFamily: FM, fontSize: '0.55rem', letterSpacing: '0.3em', color: G.goldDim, textTransform: 'uppercase' }}>
              Scan to Join
            </span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
          {/* Code hero */}
          <div>
            <div className="lbl">Room Code</div>
            <div style={{
              fontFamily: FD, fontSize: '3.6rem', letterSpacing: '0.22em',
              color: G.ivory, lineHeight: 1,
              animation: 'glowPulse 4s ease-in-out infinite',
            }}>{code}</div>
          </div>
          {/* URL + copy */}
          <div>
            <div className="lbl">Share Link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, padding: '9px 13px',
                background: G.abyss, border: `1px solid ${G.bolt}`,
                fontFamily: FE, fontStyle: 'italic', fontWeight: 300,
                fontSize: '0.8rem', color: G.chrome,
                wordBreak: 'break-all', lineHeight: 1.5,
              }}>{url}</div>
              <button
                className="btn-gold"
                onClick={copy}
                style={{
                  flexShrink: 0,
                  background: copied ? `rgba(0,214,143,0.08)` : undefined,
                  borderColor: copied ? G.green : undefined,
                  color: copied ? G.green : undefined,
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Lobby ───────────────────────────────────────────────────────────────────
type LobbyPlayer = { id: string; player_name: string; joined_at: string };

function Lobby({ code, hostName, onStart }: { code: string; hostName: string; onStart: () => void }) {
  const [players,  setPlayers]  = useState<LobbyPlayer[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('room_players').select('*').eq('room_code', code).order('joined_at', { ascending: true });
      if (data) setPlayers(data);
    }
    load();
    const ch = supabase.channel(`lobby-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_code=eq.${code}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [code]);

  async function handleStart() {
    setStarting(true);
    await supabase.from('rooms').update({ started: true }).eq('code', code);
    onStart();
  }

  const count = players.length;

  return (
    <div style={{ minHeight: '100vh', background: G.void, padding: '28px 18px 56px', fontFamily: FM, position: 'relative' }}>
      <style>{STYLES}</style>
      <div className="scanlines" />
      <Bg />

      <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SharePanel code={code} />

        <div className="panel panel-gold-top cornered fade-up" style={{ animationDelay: '0.1s' }}>
          <div style={{ padding: '24px 26px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div className="lbl">Lobby</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h2 style={{ fontFamily: FD, fontSize: '1.9rem', letterSpacing: '0.06em', color: G.ivory }}>
                    Waiting for Players
                  </h2>
                  {/* Animated dots */}
                  <div style={{ display: 'flex', gap: 4, paddingBottom: 2 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: '50%', background: G.green,
                        animation: `pulseDot 1.4s ${i * 0.22}s infinite`,
                        boxShadow: `0 0 6px ${G.green}`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Player count badge */}
              <div className="stat-pill count-pop" style={{ borderColor: count >= 2 ? `rgba(0,214,143,0.3)` : G.bolt }}>
                <div style={{
                  fontFamily: FD, fontSize: '2.8rem', lineHeight: 1,
                  color: count >= 2 ? G.green : G.amber,
                  textShadow: count >= 2 ? `0 0 20px rgba(0,214,143,0.5)` : `0 0 20px rgba(245,166,35,0.5)`,
                }}>{count}</div>
                <div style={{ fontFamily: FM, fontSize: '0.55rem', letterSpacing: '0.24em', color: G.dim, textTransform: 'uppercase', marginTop: 2 }}>
                  {count === 1 ? 'Player' : 'Players'}
                </div>
              </div>
            </div>

            {/* Player list */}
            <div style={{ border: `1px solid ${G.bolt}`, overflow: 'hidden', marginBottom: 22, background: G.abyss }}>
              {/* Column headers */}
              <div style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 70px',
                padding: '5px 16px', borderBottom: `1px solid ${G.bolt}`,
                background: `rgba(5,5,7,0.6)`,
              }}>
                {['#', 'Driver', 'Status'].map(h => (
                  <div key={h} style={{ fontFamily: FM, fontSize: '0.55rem', letterSpacing: '0.28em', color: G.dim, textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>

              {players.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', fontFamily: FE, fontStyle: 'italic', color: G.dim, fontSize: '0.92rem' }}>
                  No players yet — share the QR code or link above
                </div>
              ) : players.map((p, i) => {
                const isHost = p.player_name === hostName;
                return (
                  <div
                    key={p.id}
                    className="row-in trow"
                    style={{
                      display: 'grid', gridTemplateColumns: '36px 1fr 70px',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: i < players.length - 1 ? `1px solid rgba(58,58,82,0.25)` : 'none',
                      background: isHost ? `rgba(201,168,76,0.04)` : 'transparent',
                      borderLeft: `3px solid ${isHost ? G.goldDim : 'transparent'}`,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  >
                    {/* Rank number */}
                    <div style={{ fontFamily: FM, fontWeight: 900, fontSize: '0.82rem', color: G.dim }}>{i + 1}</div>

                    {/* Name + avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${G.iron}, ${G.steel})`,
                        border: `1.5px solid ${isHost ? G.goldDim : G.bolt}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: FM, fontWeight: 900, fontSize: '0.88rem',
                        color: isHost ? G.goldMid : G.chrome,
                      }}>
                        {p.player_name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{
                        fontFamily: FM, fontWeight: 800, fontSize: '1rem',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: isHost ? G.goldLight : G.silver,
                      }}>
                        {p.player_name}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {isHost ? (
                        <span style={{
                          fontFamily: FM, fontSize: '0.58rem', letterSpacing: '0.2em',
                          color: G.goldMid, background: `rgba(201,168,76,0.08)`,
                          border: `1px solid ${G.goldDim}`, padding: '3px 8px',
                        }}>Host</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: G.green, boxShadow: `0 0 8px ${G.green}` }} />
                          <span style={{ fontFamily: FM, fontSize: '0.58rem', letterSpacing: '0.18em', color: G.green, textTransform: 'uppercase' }}>Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Start button */}
            <button className="btn-red" onClick={handleStart} disabled={starting || count < 1}>
              {starting
                ? <><div style={{ width: 13, height: 13, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: G.white, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Starting...</>
                : <>Start Race — {count} Player{count !== 1 ? 's' : ''}</>
              }
            </button>

            {count < 2 && (
              <p style={{ textAlign: 'center', fontFamily: FE, fontStyle: 'italic', fontSize: '0.82rem', color: G.dim, marginTop: 10 }}>
                You can start alone or wait for more drivers to join
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Waiting Screen ───────────────────────────────────────────────────────────
function WaitingScreen({ code, playerName }: { code: string; playerName: string }) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [dots,    setDots]    = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 550);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('room_players').select('*').eq('room_code', code).order('joined_at', { ascending: true });
      if (data) setPlayers(data);
    }
    load();
    const ch = supabase.channel(`waiting-${code}-${playerName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_code=eq.${code}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [code, playerName]);

  return (
    <div style={{ minHeight: '100vh', background: G.void, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      <style>{STYLES}</style>
      <div className="scanlines" />
      <Bg />
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        <div className="panel panel-gold-top cornered fade-up">
          <div style={{ padding: '36px 28px', textAlign: 'center' }}>

            <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
              <F1Badge size="md" />
            </div>

            {/* Gold spinner */}
            <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 26px' }}>
              <svg width={96} height={96} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx={48} cy={48} r={38} fill="none" stroke={`rgba(201,168,76,0.12)`} strokeWidth={2} />
                <circle cx={48} cy={48} r={38} fill="none" stroke={G.goldMid} strokeWidth={2}
                  strokeDasharray="55 185" strokeLinecap="round"
                  style={{ animation: 'spin 1.4s linear infinite', transformOrigin: '48px 48px', filter: `drop-shadow(0 0 6px rgba(201,168,76,0.7))` }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>🏎</div>
            </div>

            <h2 style={{ fontFamily: FD, fontSize: '1.7rem', letterSpacing: '0.08em', color: G.ivory, marginBottom: 8 }}>
              Waiting for Host{dots}
            </h2>
            <p style={{ fontFamily: FE, fontStyle: 'italic', fontWeight: 300, fontSize: '0.96rem', color: G.chrome, marginBottom: 24, lineHeight: 1.65 }}>
              The race starts when the host clicks <span style={{ color: G.ivory, fontStyle: 'normal' }}>Start Race</span>
            </p>

            {/* Your status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '9px 18px', marginBottom: 24,
              background: G.abyss, border: `1px solid ${G.bolt}`,
              borderLeft: `3px solid ${G.green}`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: G.green, boxShadow: `0 0 8px ${G.green}` }} />
              <span style={{ fontFamily: FM, fontWeight: 800, fontSize: '1rem', letterSpacing: '0.1em', color: G.silver, textTransform: 'uppercase' }}>
                {playerName}
              </span>
              <span style={{ fontFamily: FM, fontSize: '0.58rem', letterSpacing: '0.2em', color: G.green, textTransform: 'uppercase' }}>Ready</span>
            </div>

            {/* Player list */}
            {players.length > 0 && (
              <div style={{ textAlign: 'left', border: `1px solid ${G.bolt}`, overflow: 'hidden', background: G.abyss }}>
                <div style={{ padding: '5px 16px', borderBottom: `1px solid ${G.bolt}`, fontFamily: FM, fontSize: '0.55rem', letterSpacing: '0.28em', color: G.dim, textTransform: 'uppercase' }}>
                  {players.length} in Room
                </div>
                {players.map((p, i) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                    borderBottom: i < players.length - 1 ? `1px solid rgba(58,58,82,0.2)` : 'none',
                    background: p.player_name === playerName ? `rgba(0,214,143,0.04)` : 'transparent',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: G.green, flexShrink: 0, boxShadow: `0 0 6px rgba(0,214,143,0.5)` }} />
                    <span style={{
                      fontFamily: FM, fontWeight: 700, fontSize: '0.95rem',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: p.player_name === playerName ? G.green : G.chrome,
                    }}>
                      {p.player_name}{p.player_name === playerName ? ' (you)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        <p style={{ textAlign: 'center', fontFamily: FE, fontStyle: 'italic', fontSize: '0.78rem', color: G.dim, marginTop: 14 }}>
          Room code: <span style={{ fontFamily: FM, fontWeight: 900, letterSpacing: '0.2em', color: G.chrome, fontStyle: 'normal' }}>{code}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Name Entry ───────────────────────────────────────────────────────────────
function NameEntry({ onStart, isHost }: { onStart: (name: string) => void; isHost: boolean }) {
  const [name,  setName]  = useState('');
  const [error, setError] = useState('');

  function handleStart() {
    const t = name.trim();
    if (!t) { setError('Please enter your driver name.'); return; }
    if (t.length > 20) { setError('Maximum 20 characters.'); return; }
    onStart(t);
  }

  return (
    <div style={{ minHeight: '100vh', background: G.void, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      <style>{STYLES}</style>
      <Bg />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        <div className="panel panel-gold-top cornered fade-up">
          <div style={{ padding: '34px 30px' }}>

            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
              <F1Badge size="md" />
            </div>

            <p style={{ fontFamily: FE, fontStyle: 'italic', fontWeight: 300, fontSize: '0.95rem', color: G.chrome, marginBottom: 24, textAlign: 'center', lineHeight: 1.65 }}>
              {isHost ? 'Create your driver profile to host this room' : 'Create your driver profile to join the race'}
            </p>

            <div className="lbl">Driver Name</div>
            <input
              className="field"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="e.g. Max Verstappen"
              maxLength={20}
              autoFocus
              style={{ marginBottom: error ? 10 : 18 }}
            />

            {error && (
              <div style={{
                padding: '9px 14px', marginBottom: 16,
                background: 'rgba(42,0,8,0.9)', border: `1px solid rgba(232,0,45,0.15)`,
                borderLeft: `3px solid ${G.red}`,
                fontFamily: FE, fontStyle: 'italic', fontSize: '0.9rem', color: '#ff9080',
              }}>{error}</div>
            )}

            <button className="btn-red" onClick={handleStart}>
              {isHost ? 'Continue to Lobby' : 'Join Room'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function Leaderboard({ results, currentPlayer }: { results: RoomResult[]; currentPlayer: string }) {
  const sorted = [...results].sort((a, b) => b.score !== a.score ? b.score - a.score : a.total_time - b.total_time);
  const winner = sorted[0];
  const MEDALS      = ['🥇', '🥈', '🥉'];
  const RANK_COLORS = [G.goldLight, G.silver, '#cd7f32'];

  // Team Radio — derived from the current player's result
  const myResult    = sorted.find(r => r.player_name === currentPlayer);
  const myScore     = myResult?.score ?? 0;
  const totalCats   = 15; // same as BingoGame categories count
  const myPct       = myScore / totalCats;
  const radioWin    = myPct === 1;
  const radioGood   = myPct >= 0.8;
  const audioFile   = radioWin || radioGood ? '/audio/bingo-confirmed.mp3' : '/audio/fail-radio.mp3';

  return (
    <div className="panel panel-gold-top cornered fade-up">

      {/* Winner hero */}
      {winner && (
        <div style={{
          padding: '28px 28px 22px',
          background: `linear-gradient(135deg, ${G.gunmetal}, ${G.void})`,
          borderBottom: `1px solid ${G.bolt}`,
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 240, height: 240,
            background: `radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ fontFamily: FD, fontSize: '2.8rem', marginBottom: 6 }}>🏆</div>
          <div className="lbl" style={{ justifyContent: 'center', marginBottom: 8 }}>Race Winner</div>
          <div style={{
            fontFamily: FD, fontSize: '2.4rem', letterSpacing: '0.06em',
            color: winner.player_name === currentPlayer ? G.blue : G.ivory,
            textTransform: 'uppercase',
            textShadow: winner.player_name === currentPlayer ? `0 0 28px rgba(41,121,255,0.5)` : `0 0 28px rgba(244,242,236,0.15)`,
          }}>
            {winner.player_name}
            {winner.player_name === currentPlayer && (
              <span style={{ fontSize: '1rem', color: `rgba(41,121,255,0.65)`, marginLeft: 10 }}>(You)</span>
            )}
          </div>
          {/* Winner stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 14 }}>
            {[
              { val: `${winner.score}`, label: 'Correct',  color: G.green },
              { val: formatTime(winner.total_time), label: 'Time', color: G.blue },
              ...(winner.best_streak >= 2 ? [{ val: `🔥 ${winner.best_streak}×`, label: 'Streak', color: G.amber }] : []),
            ].map(({ val, label, color }, i, arr) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: FD, fontSize: '2.2rem', color, textShadow: `0 0 16px ${color}40` }}>{val}</div>
                  <div style={{ fontFamily: FM, fontSize: '0.55rem', letterSpacing: '0.24em', color: G.dim, textTransform: 'uppercase' }}>{label}</div>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, height: 32, background: G.bolt }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header row */}
      <div style={{
        padding: '10px 22px', background: `rgba(5,5,7,0.5)`,
        borderBottom: `1px solid ${G.bolt}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <span style={{ fontFamily: FD, fontSize: '0.95rem', lineHeight: 1, color: G.white, position: 'relative', zIndex: 1, padding: '0 0.12em' }}>F1</span>
            <div style={{ position: 'absolute', inset: '2px 0', background: G.red, clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)', zIndex: 0, boxShadow: `0 0 10px rgba(232,0,45,0.5)` }} />
          </div>
          <h2 style={{ fontFamily: FD, fontSize: '1.4rem', letterSpacing: '0.08em', color: G.ivory }}>
            Race Results
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: G.green, boxShadow: `0 0 8px ${G.green}`, animation: 'pulseDot 1.5s infinite' }} />
          <span style={{ fontFamily: FM, fontSize: '0.58rem', letterSpacing: '0.22em', color: G.dim, textTransform: 'uppercase' }}>Live</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '56px 1fr 80px 96px 76px',
        padding: '6px 22px', borderBottom: `1px solid ${G.bolt}`,
        background: `rgba(5,5,7,0.3)`,
      }}>
        {['Pos', 'Driver', 'Score', 'Time', 'Streak'].map(h => (
          <div key={h} style={{ fontFamily: FM, fontSize: '0.55rem', letterSpacing: '0.28em', color: G.dim, textTransform: 'uppercase' }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', fontFamily: FE, fontStyle: 'italic', color: G.dim, fontSize: '0.92rem' }}>
          No results yet — be the first to finish!
        </div>
      ) : sorted.map((r, i) => {
        const isMe      = r.player_name === currentPlayer;
        const rank      = i + 1;
        const rankColor = RANK_COLORS[i] ?? G.dim;
        return (
          <div key={r.id ?? i} className="row-in trow" style={{
            display: 'grid', gridTemplateColumns: '56px 1fr 80px 96px 76px',
            alignItems: 'center', padding: '13px 22px',
            borderBottom: `1px solid rgba(58,58,82,0.15)`,
            background: isMe
              ? `linear-gradient(90deg, rgba(41,121,255,0.08), transparent)`
              : rank === 1 ? `linear-gradient(90deg, rgba(201,168,76,0.05), transparent)` : 'transparent',
            borderLeft: `3px solid ${isMe ? G.blue : rank <= 3 ? rankColor + '50' : 'transparent'}`,
            animationDelay: `${i * 0.07}s`,
          }}>
            {/* Position */}
            <div>
              {rank <= 3
                ? <span style={{ fontSize: '1.3rem' }}>{MEDALS[i]}</span>
                : <span style={{ fontFamily: FM, fontWeight: 900, fontSize: '1rem', color: G.dim }}>P{rank}</span>
              }
            </div>
            {/* Driver */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${G.iron}, ${G.steel})`,
                border: `1.5px solid ${isMe ? G.blue + '60' : rank <= 3 ? rankColor + '40' : G.bolt}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FM, fontWeight: 900, fontSize: '0.78rem',
                color: isMe ? G.blue : G.chrome,
              }}>
                {r.player_name.charAt(0).toUpperCase()}
              </div>
              <div style={{
                fontFamily: FM, fontWeight: 800, fontSize: '1rem',
                letterSpacing: '0.05em', textTransform: 'uppercase',
                color: isMe ? G.blueGlow : rank === 1 ? G.ivory : G.silver,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {r.player_name}
                {isMe && <span style={{ fontSize: '0.65rem', color: `rgba(41,121,255,0.6)`, marginLeft: 7 }}>(you)</span>}
              </div>
            </div>
            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: FM, fontWeight: 900, fontSize: '1.35rem', color: G.green, textShadow: `0 0 12px rgba(0,214,143,0.35)` }}>{r.score}</span>
              <span style={{ fontFamily: FM, fontSize: '0.72rem', color: G.dim }}>/15</span>
            </div>
            {/* Time */}
            <div style={{ fontFamily: FM, fontWeight: 700, fontSize: '0.92rem', color: G.chrome }}>
              ⏱ {formatTime(r.total_time)}
            </div>
            {/* Streak */}
            <div style={{ fontFamily: FM, fontWeight: 700, fontSize: '0.92rem', color: r.best_streak >= 3 ? G.amber : G.dim }}>
              {r.best_streak >= 2 ? `🔥 ${r.best_streak}×` : `${r.best_streak}×`}
            </div>
          </div>
        );
      })}

      {/* Team Radio */}
      {myResult && (
        <div style={{
          margin: '0 22px 0',
          background: G.abyss, border: `1px solid ${G.bolt}`,
          borderLeft: `2px solid ${G.goldDim}`,
          padding: '10px 16px',
          fontFamily: FE, fontStyle: 'italic', fontWeight: 300,
          fontSize: '0.97rem', color: G.silver, lineHeight: 1.65,
        }}>
          <div style={{ fontFamily: FM, fontSize: '0.58rem', letterSpacing: '0.26em', color: G.goldDim, marginBottom: 6, textTransform: 'uppercase', fontStyle: 'normal' }}>
            ─ Team Radio · Race Engineer
          </div>
          {radioWin ? (
            <>
              <p style={{ margin: '0 0 2px' }}>„Guys… guys… is this Bingo confirmed?"</p>
              <p style={{ margin: 0 }}>„Copy. <span style={{ color: G.green, fontStyle: 'normal' }}>Bingo confirmed.</span> Box, box for celebration!"</p>
            </>
          ) : radioGood ? (
            <p style={{ margin: 0 }}>„Good session. <span style={{ color: G.amber, fontStyle: 'normal' }}>Almost there.</span> We&apos;ll debrief and come back stronger."</p>
          ) : (
            <>
              <p style={{ margin: '0 0 2px' }}>„We had Bingo?"</p>
              <p style={{ margin: 0 }}>„<span style={{ color: G.red, fontStyle: 'normal' }}>Negative.</span> Wrong strategy. Box, we need to talk."</p>
            </>
          )}
          <audio autoPlay>
            <source src={audioFile} type="audio/mpeg" />
          </audio>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '8px 22px', borderTop: `1px solid ${G.bolt}`,
        fontFamily: FE, fontStyle: 'italic', fontWeight: 300,
        fontSize: '0.75rem', color: G.dim, textAlign: 'center',
        background: `rgba(5,5,7,0.4)`,
      }}>
        Sorted by score · tiebreak by fastest time · updates live as drivers finish
      </div>
    </div>
  );
}

// ─── Main Room Page ───────────────────────────────────────────────────────────
type Phase = 'loading' | 'not-found' | 'name' | 'lobby' | 'waiting' | 'playing' | 'done';

export default function RoomPage() {
  const params = useParams();
  const code   = (params.code as string).toUpperCase();

  const [phase,      setPhase]      = useState<Phase>('loading');
  const [playerName, setPlayerName] = useState('');
  const [isHost,     setIsHost]     = useState(false);
  const [seed,       setSeed]       = useState('');
  const [results,    setResults]    = useState<RoomResult[]>([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('rooms').select('code,seed,started,host_name').eq('code', code).single();
      if (error || !data) { setPhase('not-found'); return; }
      setSeed(data.seed);
      setPhase('name');
    }
    load();
  }, [code]);

  // Watch for game start (non-host waiting players)
  useEffect(() => {
    if (phase !== 'waiting') return;
    async function checkStarted() {
      const { data } = await supabase.from('rooms').select('started').eq('code', code).single();
      if (data?.started) setPhase('playing');
    }
    checkStarted();
    const pollId = setInterval(checkStarted, 2000);
    const ch = supabase.channel(`start-watch-${code}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, payload => {
        if (payload.new?.started) { clearInterval(pollId); setPhase('playing'); }
      })
      .subscribe();
    return () => { clearInterval(pollId); supabase.removeChannel(ch); };
  }, [phase, code]);

  // Load + subscribe results
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'done') return;
    async function loadResults() {
      const { data } = await supabase.from('room_results').select('*').eq('room_code', code).order('score', { ascending: false });
      if (data) setResults(data);
    }
    loadResults();
    const ch = supabase.channel(`results-${code}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_results', filter: `room_code=eq.${code}` }, loadResults)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [code, phase]);

  async function handleNameSubmit(name: string) {
    setPlayerName(name);
    await supabase.from('room_players').insert({ room_code: code, player_name: name });
    const { data } = await supabase.from('rooms').select('started,host_name').eq('code', code).single();
    if (data?.started) { setPhase('playing'); return; }
    if (!data?.host_name) {
      await supabase.from('rooms').update({ host_name: name }).eq('code', code);
      setIsHost(true); setPhase('lobby');
    } else {
      setIsHost(false); setPhase('waiting');
    }
  }

  async function handleGameDone(score: number, totalTime: number, bestStreak: number) {
    await supabase.from('room_results').insert({ room_code: code, player_name: playerName, score, total_time: totalTime, best_streak: bestStreak });
    setPhase('done');
  }

  // ── Loading ──
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', background: G.void, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <style>{STYLES}</style>
      <div style={{ width: 40, height: 40, border: `2px solid ${G.bolt}`, borderTopColor: G.goldMid, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontFamily: FM, fontSize: '0.72rem', letterSpacing: '0.32em', color: G.dim, textTransform: 'uppercase' }}>Loading Room...</div>
    </div>
  );

  // ── Not Found ──
  if (phase === 'not-found') return (
    <div style={{ minHeight: '100vh', background: G.void, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, position: 'relative' }}>
      <style>{STYLES}</style>
      <Bg />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: FD, fontSize: '2.6rem', letterSpacing: '0.08em', color: G.red }}>Room Not Found</div>
        <div style={{ fontFamily: FE, fontStyle: 'italic', color: G.chrome, textAlign: 'center', fontSize: '0.96rem' }}>
          Room <span style={{ fontFamily: FM, fontWeight: 900, letterSpacing: '0.18em', color: G.ivory, fontStyle: 'normal' }}>{code}</span> doesn&apos;t exist.
        </div>
        <a href="/" className="btn-ghost" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px 22px', marginTop: 8,
          fontFamily: FM, fontWeight: 700, fontSize: '0.78rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          background: 'transparent', border: `1px solid ${G.bolt}`, color: G.chrome,
        }}>
          ← Back to Home
        </a>
      </div>
    </div>
  );

  if (phase === 'name')    return <NameEntry isHost={isHost} onStart={handleNameSubmit} />;
  if (phase === 'lobby')   return <Lobby code={code} hostName={playerName} onStart={() => setPhase('playing')} />;
  if (phase === 'waiting') return <WaitingScreen code={code} playerName={playerName} />;
  if (phase === 'playing') return <BingoGame onDone={handleGameDone} />;

  // ── Done / Results ──
  return (
    <div style={{ minHeight: '100vh', background: G.void, padding: '28px 18px 64px', position: 'relative' }}>
      <style>{STYLES}</style>
      <Bg />
      <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SharePanel code={code} showQR={false} />
        <Leaderboard results={results} currentPlayer={playerName} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20 }}>
          {[
            { href: `/room/${code}`, label: '↺ Play Again' },
            { href: '/',             label: '+ New Room'   },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 24px',
                fontFamily: FM, fontWeight: 700, fontSize: '0.78rem',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                background: 'transparent', border: `1px solid ${G.bolt}`, color: G.chrome,
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = G.goldDim; (e.currentTarget as HTMLAnchorElement).style.color = G.goldMid; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = G.bolt;    (e.currentTarget as HTMLAnchorElement).style.color = G.chrome; }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}