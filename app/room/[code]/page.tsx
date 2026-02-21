'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase, RoomResult } from '@/lib/supabase';
import BingoGame from '@/components/BingoGame';

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  black:  '#04040a',
  deep:   '#080814',
  steel:  '#0e0e1c',
  iron:   '#141426',
  plate:  '#1a1a30',
  bolt:   '#252540',
  dim:    '#44446a',
  chrome: '#7878a8',
  silver: '#b8b8d8',
  white:  '#e8e8ff',
  red:    '#e8002d',
  redGlow:'#ff1744',
  redLo:  '#2a000a',
  green:  '#00e676',
  amber:  '#ffb300',
  blue:   '#2979ff',
  blueGlow:'#448aff',
} as const;

const F  = "'Barlow Condensed','Arial Narrow',sans-serif";
const FM = "'Titillium Web','Segoe UI',sans-serif";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=Titillium+Web:wght@300;400;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${C.black}; overflow-x: hidden; }
input { font-family: inherit; }
input:focus { outline: none !important; }
a { text-decoration: none; color: inherit; }
button { font-family: inherit; cursor: pointer; }

@keyframes flicker {
  0%,100% { opacity:1 } 92% { opacity:1 } 93% { opacity:.85 } 94% { opacity:1 } 96% { opacity:.9 } 97% { opacity:1 }
}
@keyframes scan {
  0% { transform: translateY(-100%) }
  100% { transform: translateY(100vh) }
}
@keyframes pulse-ring {
  0% { transform:scale(1); opacity:.6 }
  100% { transform:scale(1.6); opacity:0 }
}
@keyframes spin {
  to { transform: rotate(360deg) }
}
@keyframes slide-up {
  from { opacity:0; transform:translateY(18px) }
  to   { opacity:1; transform:translateY(0) }
}
@keyframes row-in {
  from { opacity:0; transform:translateX(-12px) }
  to   { opacity:1; transform:translateX(0) }
}
@keyframes count-pop {
  0%   { transform:scale(1.5); opacity:0 }
  60%  { transform:scale(0.9) }
  100% { transform:scale(1); opacity:1 }
}
@keyframes shimmer {
  0%   { background-position: -500px 0 }
  100% { background-position:  500px 0 }
}
@keyframes bar-fill {
  from { width: 0 }
}

.slide-up  { animation: slide-up 0.45s cubic-bezier(0.22,1,0.36,1) both }
.row-in    { animation: row-in  0.35s cubic-bezier(0.22,1,0.36,1) both }
.count-pop { animation: count-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both }

.btn-primary {
  display:flex; align-items:center; justify-content:center; gap:10px;
  width:100%; padding:16px 0;
  font-family:${F}; font-weight:900; font-size:1.1rem; letter-spacing:0.18em; text-transform:uppercase;
  color:${C.white}; background:${C.red}; border:none;
  clip-path:polygon(14px 0%,100% 0%,calc(100% - 14px) 100%,0% 100%);
  box-shadow:0 0 28px ${C.red}50, inset 0 1px 0 rgba(255,255,255,0.12);
  transition:box-shadow 0.2s, transform 0.15s;
  position:relative; overflow:hidden;
}
.btn-primary::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);
  transform:translateX(-100%); transition:transform 0.4s;
}
.btn-primary:hover { box-shadow:0 0 48px ${C.red}80, inset 0 1px 0 rgba(255,255,255,0.15); transform:translateY(-1px); }
.btn-primary:hover::after { transform:translateX(100%); }
.btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

.btn-ghost {
  padding:10px 20px;
  font-family:${F}; font-weight:700; font-size:0.85rem; letter-spacing:0.16em; text-transform:uppercase;
  color:${C.chrome}; background:transparent;
  border:1px solid ${C.bolt};
  transition:all 0.15s;
}
.btn-ghost:hover { color:${C.white}; border-color:${C.chrome}; background:${C.plate}20; }

.card {
  background:linear-gradient(155deg,${C.iron} 0%,${C.steel} 100%);
  border:1px solid ${C.bolt};
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.03), 0 12px 48px rgba(0,0,0,0.8);
  overflow:hidden;
  position:relative;
}
.card-red-top { height:3px; background:${C.red}; box-shadow:0 0 20px ${C.red}80; }
.card-dim-top { height:1px; background:linear-gradient(90deg,transparent,${C.bolt},transparent); }

.label {
  font-family:${F}; font-weight:700; font-size:0.6rem;
  letter-spacing:0.32em; color:${C.dim}; text-transform:uppercase;
  margin-bottom:6px;
}
.label::before { content:'▶ '; }

input.field {
  width:100%; padding:13px 16px;
  font-family:${FM}; font-size:1rem;
  background:${C.deep}; border:1px solid ${C.bolt};
  color:${C.white};
  transition:border-color 0.15s, box-shadow 0.15s;
}
input.field:focus { border-color:${C.chrome}; box-shadow:0 0 0 2px ${C.chrome}15; }
input.field::placeholder { color:${C.dim}; }

.stat-pill {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:10px 18px; min-width:72px;
  background:${C.deep}; border:1px solid ${C.bolt};
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function F1Badge() {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:10,
    }}>
      <div style={{
        background:C.red, padding:'3px 11px',
        clipPath:'polygon(7px 0%,100% 0%,calc(100% - 7px) 100%,0% 100%)',
        fontFamily:F, fontWeight:900, fontSize:'1rem', letterSpacing:'0.08em', color:C.white,
        boxShadow:`0 0 16px ${C.red}60`,
      }}>F1</div>
      <span style={{ fontFamily:F, fontWeight:900, fontSize:'1.8rem', letterSpacing:'0.14em', color:C.white }}>
        BINGO
      </span>
    </div>
  );
}

function QRCode({ url, size=150 }: { url:string; size?:number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size*2}x${size*2}&data=${encodeURIComponent(url)}&bgcolor=080814&color=b8b8d8&margin=1&qzone=1`;
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      border:`1px solid ${C.bolt}`,
      background:C.deep,
      position:'relative', overflow:'hidden',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="QR" width={size} height={size} style={{ display:'block' }} />
      {/* Corner brackets */}
      {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i) => (
        <div key={i} style={{
          position:'absolute', width:12, height:12,
          borderColor:C.red, borderStyle:'solid', borderWidth:0,
          borderTopWidth:   (pos.top    !== undefined) ? 2 : 0,
          borderBottomWidth:(pos.bottom !== undefined) ? 2 : 0,
          borderLeftWidth:  (pos.left   !== undefined) ? 2 : 0,
          borderRightWidth: (pos.right  !== undefined) ? 2 : 0,
          ...pos,
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARE PANEL
// ─────────────────────────────────────────────────────────────────────────────
function SharePanel({ code, showQR=true }: { code:string; showQR?:boolean }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl]       = useState(`/room/${code}`);

  useEffect(() => { setUrl(`${window.location.origin}/room/${code}`); }, [code]);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div className="card slide-up" style={{ marginBottom:12 }}>
      <div className="card-red-top" />
      <div style={{ padding:'20px 24px', display:'flex', gap:20, alignItems:'stretch', flexWrap:'wrap' }}>

        {showQR && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 }}>
            <QRCode url={url} size={140} />
            <span style={{ fontFamily:F, fontSize:'0.58rem', letterSpacing:'0.28em', color:C.dim, textTransform:'uppercase' }}>
              SCAN TO JOIN
            </span>
          </div>
        )}

        <div style={{ flex:1, minWidth:200, display:'flex', flexDirection:'column', justifyContent:'space-between', gap:16 }}>
          {/* Code hero */}
          <div>
            <div className="label">Room Code</div>
            <div style={{
              fontFamily:F, fontWeight:900, fontSize:'3.4rem', letterSpacing:'0.22em',
              color:C.white, lineHeight:1,
              textShadow:`0 0 40px ${C.white}10`,
              animation:'flicker 8s ease-in-out infinite',
            }}>{code}</div>
          </div>

          {/* URL + copy */}
          <div>
            <div className="label">Share Link</div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{
                flex:1, padding:'9px 13px',
                background:C.deep, border:`1px solid ${C.bolt}`,
                fontFamily:FM, fontSize:'0.78rem', color:C.chrome,
                wordBreak:'break-all', lineHeight:1.5,
              }}>{url}</div>
              <button
                onClick={copy}
                className="btn-ghost"
                style={{
                  flexShrink:0,
                  background: copied ? `${C.green}15` : undefined,
                  borderColor: copied ? C.green : undefined,
                  color: copied ? C.green : undefined,
                  whiteSpace:'nowrap',
                }}
              >
                {copied ? '✓ COPIED' : '📋 COPY'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOBBY
// ─────────────────────────────────────────────────────────────────────────────
type LobbyPlayer = { id:string; player_name:string; joined_at:string };

function Lobby({ code, hostName, onStart }: { code:string; hostName:string; onStart:()=>void }) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('room_players').select('*').eq('room_code', code).order('joined_at', { ascending: true });
      if (data) setPlayers(data);
    }
    load();
    const ch = supabase.channel(`lobby-${code}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'room_players', filter:`room_code=eq.${code}` }, load)
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
    <div style={{
      minHeight:'100vh',
      backgroundImage:'url(/background/f1-bg.jpg)',
      backgroundSize:'cover', backgroundPosition:'center',
      padding:'24px 18px 48px',
    }}>
      <style>{STYLES}</style>

      {/* Scan line effect */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden',
        background:'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.015) 50%)',
        backgroundSize:'100% 3px',
      }} />

      <div style={{ maxWidth:600, margin:'0 auto', position:'relative', zIndex:1 }}>
        <SharePanel code={code} />

        <div className="card slide-up" style={{ animationDelay:'0.1s' }}>
          <div className="card-dim-top" />
          <div style={{ padding:'22px 24px' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div className="label">Lobby</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'1.8rem', letterSpacing:'0.08em', color:C.white }}>
                    WAITING FOR PLAYERS
                  </h2>
                  <div style={{ display:'flex', gap:4, paddingBottom:2 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width:5, height:5, borderRadius:'50%', background:C.green,
                        animation:`pulse-ring 1.4s ease-out ${i*0.22}s infinite`,
                        boxShadow:`0 0 6px ${C.green}`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Player count */}
              <div className="stat-pill count-pop" style={{ borderColor: count >= 2 ? `${C.green}40` : C.bolt }}>
                <div style={{
                  fontFamily:F, fontWeight:900, fontSize:'2.6rem', lineHeight:1,
                  color: count >= 2 ? C.green : C.amber,
                  textShadow: count >= 2 ? `0 0 20px ${C.green}60` : `0 0 20px ${C.amber}60`,
                }}>{count}</div>
                <div style={{ fontFamily:F, fontSize:'0.58rem', letterSpacing:'0.22em', color:C.dim, textTransform:'uppercase', marginTop:2 }}>
                  {count === 1 ? 'PLAYER' : 'PLAYERS'}
                </div>
              </div>
            </div>

            {/* Player list */}
            <div style={{
              border:`1px solid ${C.bolt}`, overflow:'hidden', marginBottom:20,
              background:C.deep,
            }}>
              {/* Column header */}
              <div style={{
                display:'grid', gridTemplateColumns:'32px 1fr 60px',
                padding:'5px 14px', borderBottom:`1px solid ${C.bolt}`,
                background:`${C.black}60`,
              }}>
                {['#','PLAYER','STATUS'].map(h => (
                  <div key={h} style={{ fontFamily:F, fontSize:'0.58rem', letterSpacing:'0.26em', color:C.dim }}>{h}</div>
                ))}
              </div>

              {players.length === 0 ? (
                <div style={{
                  padding:'24px', textAlign:'center',
                  fontFamily:FM, color:C.dim, fontSize:'0.88rem',
                }}>
                  No players yet — share the QR code or link above
                </div>
              ) : players.map((p, i) => {
                const isHost = p.player_name === hostName;
                return (
                  <div
                    key={p.id}
                    className="row-in"
                    style={{
                      display:'grid', gridTemplateColumns:'32px 1fr 60px',
                      alignItems:'center',
                      padding:'11px 14px',
                      borderBottom: i < players.length-1 ? `1px solid ${C.bolt}20` : 'none',
                      background: isHost ? `${C.red}08` : 'transparent',
                      borderLeft: `3px solid ${isHost ? C.red : 'transparent'}`,
                      animationDelay:`${i*0.06}s`,
                    }}
                  >
                    {/* Rank number */}
                    <div style={{ fontFamily:F, fontWeight:900, fontSize:'0.9rem', color:C.dim }}>{i+1}</div>

                    {/* Name + avatar */}
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:30, height:30, borderRadius:'50%',
                        background:`linear-gradient(135deg, ${C.plate}, ${C.bolt})`,
                        border:`2px solid ${isHost ? C.red+'60' : C.bolt}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:F, fontWeight:900, fontSize:'0.9rem',
                        color: isHost ? C.silver : C.chrome,
                        flexShrink:0,
                      }}>
                        {p.player_name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{
                        fontFamily:F, fontWeight:800, fontSize:'1.05rem',
                        letterSpacing:'0.06em', textTransform:'uppercase',
                        color: isHost ? C.white : C.silver,
                      }}>
                        {p.player_name}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      {isHost ? (
                        <div style={{
                          fontFamily:F, fontWeight:900, fontSize:'0.6rem', letterSpacing:'0.18em',
                          color:C.red, background:`${C.red}15`,
                          border:`1px solid ${C.red}30`, padding:'2px 7px',
                        }}>HOST</div>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{
                            width:6, height:6, borderRadius:'50%', background:C.green,
                            boxShadow:`0 0 8px ${C.green}`,
                          }} />
                          <span style={{ fontFamily:F, fontSize:'0.6rem', letterSpacing:'0.18em', color:C.green }}>READY</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Start button */}
            <button className="btn-primary" onClick={handleStart} disabled={starting || count < 1}>
              {starting
                ? <><div style={{ width:14,height:14,border:`2px solid ${C.white}40`,borderTopColor:C.white,borderRadius:'50%',animation:'spin 0.8s linear infinite' }} /> STARTING...</>
                : <>🏁 START RACE — {count} PLAYER{count!==1?'S':''}</>
              }
            </button>

            {count < 2 && (
              <p style={{ textAlign:'center', fontFamily:FM, fontSize:'0.75rem', color:C.dim, marginTop:10 }}>
                You can start alone or wait for more players to join
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WAITING SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function WaitingScreen({ code, playerName }: { code:string; playerName:string }) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [dots, setDots]       = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('room_players').select('*').eq('room_code', code).order('joined_at', { ascending: true });
      if (data) setPlayers(data);
    }
    load();
    const ch = supabase.channel(`waiting-players-${code}-${playerName}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'room_players', filter:`room_code=eq.${code}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [code, playerName]);

  return (
    <div style={{
      minHeight:'100vh',
      backgroundImage:'url(/background/f1-bg.jpg)',
      backgroundSize:'cover', backgroundPosition:'center',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'24px',
    }}>
      <style>{STYLES}</style>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div className="card slide-up">
          <div className="card-red-top" />
          <div style={{ padding:'36px 28px', textAlign:'center' }}>

            <div style={{ marginBottom:28 }}>
              <F1Badge />
            </div>

            {/* Animated spinner with car */}
            <div style={{ position:'relative', width:96, height:96, margin:'0 auto 24px' }}>
              {/* Outer pulse ring */}
              <div style={{
                position:'absolute', inset:-8,
                borderRadius:'50%', border:`1px solid ${C.red}30`,
                animation:'pulse-ring 2s ease-out infinite',
              }} />
              {/* Spinning ring */}
              <svg width={96} height={96} style={{ position:'absolute', transform:'rotate(-90deg)' }}>
                <circle cx={48} cy={48} r={38} fill="none" stroke={`${C.red}15`} strokeWidth={2} />
                <circle cx={48} cy={48} r={38} fill="none" stroke={C.red} strokeWidth={2}
                  strokeDasharray="60 180" strokeLinecap="round"
                  style={{ animation:'spin 1.2s linear infinite', transformOrigin:'48px 48px', filter:`drop-shadow(0 0 6px ${C.red}80)` }}
                />
              </svg>
              <div style={{
                position:'absolute', inset:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'2rem',
              }}>🏎</div>
            </div>

            <h2 style={{
              fontFamily:F, fontWeight:900, fontSize:'1.6rem',
              letterSpacing:'0.1em', color:C.white, marginBottom:8,
            }}>
              WAITING FOR HOST{dots}
            </h2>
            <p style={{ fontFamily:FM, fontSize:'0.88rem', color:C.chrome, marginBottom:24, lineHeight:1.6 }}>
              The race starts when the host clicks <span style={{ color:C.white, fontWeight:600 }}>Start Race</span>
            </p>

            {/* Your status badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'8px 18px', marginBottom:24,
              background:C.deep, border:`1px solid ${C.bolt}`,
              borderLeft:`3px solid ${C.green}`,
            }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:C.green, boxShadow:`0 0 8px ${C.green}` }} />
              <span style={{ fontFamily:F, fontWeight:800, fontSize:'1rem', letterSpacing:'0.1em', color:C.silver, textTransform:'uppercase' }}>
                {playerName}
              </span>
              <span style={{ fontFamily:F, fontSize:'0.6rem', letterSpacing:'0.2em', color:C.green }}>READY</span>
            </div>

            {/* Player list */}
            {players.length > 0 && (
              <div style={{ textAlign:'left', border:`1px solid ${C.bolt}`, overflow:'hidden', background:C.deep }}>
                <div style={{
                  padding:'5px 14px', borderBottom:`1px solid ${C.bolt}`,
                  fontFamily:F, fontSize:'0.58rem', letterSpacing:'0.26em', color:C.dim, textTransform:'uppercase',
                }}>
                  {players.length} IN ROOM
                </div>
                {players.map((p, i) => (
                  <div key={p.id} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                    borderBottom: i < players.length-1 ? `1px solid ${C.bolt}20` : 'none',
                    background: p.player_name === playerName ? `${C.green}06` : 'transparent',
                  }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:C.green, flexShrink:0, boxShadow:`0 0 6px ${C.green}60` }} />
                    <span style={{
                      fontFamily:F, fontWeight:700, fontSize:'0.95rem',
                      letterSpacing:'0.06em', textTransform:'uppercase',
                      color: p.player_name === playerName ? C.green : C.chrome,
                    }}>
                      {p.player_name}{p.player_name === playerName ? ' (you)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign:'center', fontFamily:FM, fontSize:'0.74rem', color:C.dim, marginTop:14 }}>
          Room code: <span style={{ fontFamily:F, fontWeight:700, fontSize:'0.9rem', letterSpacing:'0.18em', color:C.chrome }}>{code}</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAME ENTRY
// ─────────────────────────────────────────────────────────────────────────────
function NameEntry({ onStart, isHost }: { onStart:(name:string)=>void; isHost:boolean }) {
  const [name, setName]   = useState('');
  const [error, setError] = useState('');

  function handleStart() {
    const t = name.trim();
    if (!t) { setError('Please enter your name.'); return; }
    if (t.length > 20) { setError('Max 20 characters.'); return; }
    onStart(t);
  }

  return (
    <div style={{
      minHeight:'100vh',
      backgroundImage:'url(/background/f1-bg.jpg)',
      backgroundSize:'cover', backgroundPosition:'center',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'24px',
    }}>
      <style>{STYLES}</style>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div className="card slide-up">
          <div className="card-red-top" />
          <div style={{ padding:'32px 28px' }}>

            <div style={{ marginBottom:22 }}>
              <F1Badge />
              <p style={{ fontFamily:FM, fontSize:'0.85rem', color:C.chrome, marginTop:8, letterSpacing:'0.03em' }}>
                {isHost ? 'Create your driver profile to host this room' : 'Create your driver profile to join the race'}
              </p>
            </div>

            <div className="label">Your Name</div>
            <input
              className="field"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="e.g. Max Verstappen"
              maxLength={20}
              autoFocus
              style={{ marginBottom: error ? 8 : 16 }}
            />

            {error && (
              <div style={{
                padding:'8px 12px', marginBottom:14,
                background:`${C.redLo}cc`, border:`1px solid ${C.red}25`,
                borderLeft:`3px solid ${C.red}`,
                fontFamily:FM, fontSize:'0.84rem', color:'#ff8070',
              }}>{error}</div>
            )}

            <button className="btn-primary" onClick={handleStart}>
              {isHost ? '🏁 CONTINUE TO LOBBY' : '🚀 JOIN ROOM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Leaderboard({ results, currentPlayer }: { results:RoomResult[]; currentPlayer:string }) {
  const sorted = [...results].sort((a,b) => b.score !== a.score ? b.score - a.score : a.total_time - b.total_time);
  const winner = sorted[0];

  const MEDALS = ['🥇','🥈','🥉'];
  const RANK_COLORS = [C.amber, C.silver, '#cd7f32'];

  return (
    <div className="card slide-up">
      <div className="card-red-top" />

      {/* Winner hero — only if results exist */}
      {winner && (
        <div style={{
          padding:'24px 24px 20px',
          background:`linear-gradient(135deg, ${C.iron}, ${C.black})`,
          borderBottom:`1px solid ${C.bolt}`,
          textAlign:'center',
          position:'relative', overflow:'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            width:200, height:200,
            background:`radial-gradient(circle, ${C.amber}12, transparent 70%)`,
            pointerEvents:'none',
          }} />

          <div style={{ fontFamily:F, fontSize:'3rem', marginBottom:6 }}>🏆</div>
          <div style={{ fontFamily:F, fontWeight:900, fontSize:'0.6rem', letterSpacing:'0.32em', color:C.dim, textTransform:'uppercase', marginBottom:6 }}>
            RACE WINNER
          </div>
          <div style={{
            fontFamily:F, fontWeight:900, fontSize:'2.2rem', letterSpacing:'0.08em',
            color: winner.player_name === currentPlayer ? C.blue : C.white,
            textTransform:'uppercase',
            textShadow: winner.player_name === currentPlayer ? `0 0 24px ${C.blue}60` : `0 0 24px ${C.white}20`,
          }}>
            {winner.player_name}
            {winner.player_name === currentPlayer && (
              <span style={{ fontSize:'1rem', color:`${C.blue}80`, marginLeft:8 }}>(YOU)</span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:18, marginTop:12 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:F, fontWeight:900, fontSize:'2rem', color:C.green, textShadow:`0 0 16px ${C.green}50` }}>{winner.score}</div>
              <div style={{ fontFamily:F, fontSize:'0.58rem', letterSpacing:'0.22em', color:C.dim }}>CORRECT</div>
            </div>
            <div style={{ width:1, height:32, background:C.bolt }} />
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:F, fontWeight:900, fontSize:'2rem', color:C.blue }}>{formatTime(winner.total_time)}</div>
              <div style={{ fontFamily:F, fontSize:'0.58rem', letterSpacing:'0.22em', color:C.dim }}>TIME</div>
            </div>
            {winner.best_streak >= 2 && <>
              <div style={{ width:1, height:32, background:C.bolt }} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:F, fontWeight:900, fontSize:'2rem', color:C.amber }}>🔥 {winner.best_streak}×</div>
                <div style={{ fontFamily:F, fontSize:'0.58rem', letterSpacing:'0.22em', color:C.dim }}>STREAK</div>
              </div>
            </>}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding:'12px 22px',
        background:C.deep,
        borderBottom:`1px solid ${C.bolt}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            background:C.red, padding:'2px 9px',
            clipPath:'polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)',
            fontFamily:F, fontWeight:900, fontSize:'0.85rem', color:C.white,
            boxShadow:`0 0 10px ${C.red}50`,
          }}>F1</div>
          <h2 style={{ fontFamily:F, fontWeight:900, fontSize:'1.4rem', letterSpacing:'0.1em', color:C.white }}>
            RACE RESULTS
          </h2>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:C.green, boxShadow:`0 0 8px ${C.green}`, animation:'pulse-ring 1.5s ease-out infinite' }} />
          <span style={{ fontFamily:F, fontSize:'0.6rem', letterSpacing:'0.22em', color:C.dim }}>LIVE</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display:'grid', gridTemplateColumns:'52px 1fr 80px 90px 72px',
        padding:'6px 22px',
        borderBottom:`1px solid ${C.bolt}`,
        background:`${C.black}40`,
      }}>
        {['POS','PLAYER','SCORE','TIME','STREAK'].map(h => (
          <div key={h} style={{ fontFamily:F, fontSize:'0.58rem', letterSpacing:'0.26em', color:C.dim }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div style={{ padding:'32px', textAlign:'center', fontFamily:FM, color:C.dim, fontSize:'0.88rem' }}>
          No results yet — be the first to finish!
        </div>
      ) : sorted.map((r, i) => {
        const isMe   = r.player_name === currentPlayer;
        const rank   = i + 1;
        const rankColor = RANK_COLORS[i] ?? C.dim;

        return (
          <div key={r.id ?? i} className="row-in" style={{
            display:'grid', gridTemplateColumns:'52px 1fr 80px 90px 72px',
            alignItems:'center',
            padding:'12px 22px',
            borderBottom:`1px solid ${C.bolt}15`,
            background: isMe
              ? `linear-gradient(90deg, ${C.blue}12, transparent)`
              : rank === 1 ? `linear-gradient(90deg, ${C.amber}06, transparent)` : 'transparent',
            borderLeft:`3px solid ${isMe ? C.blue : rank <= 3 ? rankColor+'40' : 'transparent'}`,
            animationDelay:`${i*0.07}s`,
            transition:'background 0.3s',
          }}>
            {/* Position */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {rank <= 3
                ? <span style={{ fontSize:'1.2rem' }}>{MEDALS[i]}</span>
                : <span style={{ fontFamily:F, fontWeight:900, fontSize:'1rem', color:C.dim }}>P{rank}</span>
              }
            </div>

            {/* Player */}
            <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
              <div style={{
                width:26, height:26, borderRadius:'50%', flexShrink:0,
                background:`linear-gradient(135deg, ${C.plate}, ${C.bolt})`,
                border:`1.5px solid ${isMe ? C.blue+'60' : rank<=3 ? rankColor+'40' : C.bolt}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:F, fontWeight:900, fontSize:'0.78rem',
                color: isMe ? C.blue : C.chrome,
              }}>
                {r.player_name.charAt(0).toUpperCase()}
              </div>
              <div style={{
                fontFamily:F, fontWeight:800, fontSize:'1rem',
                letterSpacing:'0.05em', textTransform:'uppercase',
                color: isMe ? C.blueGlow : rank === 1 ? C.white : C.silver,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {r.player_name}
                {isMe && <span style={{ fontSize:'0.65rem', color:`${C.blue}70`, marginLeft:6, letterSpacing:'0.12em' }}>(YOU)</span>}
              </div>
            </div>

            {/* Score */}
            <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
              <span style={{ fontFamily:F, fontWeight:900, fontSize:'1.3rem', color:C.green, textShadow:`0 0 12px ${C.green}40` }}>
                {r.score}
              </span>
              <span style={{ fontFamily:F, fontSize:'0.7rem', color:C.dim }}>/15</span>
            </div>

            {/* Time */}
            <div style={{ fontFamily:F, fontWeight:700, fontSize:'0.92rem', color:C.chrome }}>
              ⏱ {formatTime(r.total_time)}
            </div>

            {/* Streak */}
            <div style={{ fontFamily:F, fontWeight:700, fontSize:'0.92rem', color: r.best_streak >= 3 ? C.amber : C.dim }}>
              {r.best_streak >= 2 ? `🔥 ${r.best_streak}×` : `${r.best_streak}×`}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{
        padding:'8px 22px', borderTop:`1px solid ${C.bolt}`,
        fontFamily:FM, fontSize:'0.72rem', color:C.dim, textAlign:'center',
        background:`${C.black}40`,
      }}>
        Sorted by score · tiebreak by fastest time · updates live as players finish
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROOM PAGE
// ─────────────────────────────────────────────────────────────────────────────
type Phase = 'loading' | 'not-found' | 'name' | 'lobby' | 'waiting' | 'playing' | 'done';

export default function RoomPage() {
  const params = useParams();
  const code   = (params.code as string).toUpperCase();

  const [phase, setPhase]           = useState<Phase>('loading');
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost]         = useState(false);
  const [seed, setSeed]             = useState('');
  const [results, setResults]       = useState<RoomResult[]>([]);

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
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'rooms', filter:`code=eq.${code}` }, payload => {
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
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'room_results', filter:`room_code=eq.${code}` }, loadResults)
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
      setIsHost(true);
      setPhase('lobby');
    } else {
      setIsHost(false);
      setPhase('waiting');
    }
  }

  async function handleGameDone(score: number, totalTime: number, bestStreak: number) {
    await supabase.from('room_results').insert({ room_code: code, player_name: playerName, score, total_time: totalTime, best_streak: bestStreak });
    setPhase('done');
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{ minHeight:'100vh', background:C.black, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{STYLES}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44,height:44,border:`3px solid ${C.bolt}`,borderTopColor:C.red,borderRadius:'50%',animation:'spin 0.9s linear infinite',margin:'0 auto 16px' }} />
        <div style={{ fontFamily:F, fontSize:'0.85rem', letterSpacing:'0.28em', color:C.dim }}>LOADING ROOM...</div>
      </div>
    </div>
  );

  if (phase === 'not-found') return (
    <div style={{ minHeight:'100vh', background:C.black, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
      <style>{STYLES}</style>
      <div style={{ fontFamily:F, fontWeight:900, fontSize:'2.4rem', letterSpacing:'0.1em', color:C.red }}>ROOM NOT FOUND</div>
      <div style={{ fontFamily:FM, color:C.chrome, textAlign:'center' }}>
        Room <span style={{ fontFamily:F, fontWeight:900, letterSpacing:'0.14em', color:C.white }}>{code}</span> doesn&apos;t exist.
      </div>
      <a href="/" className="btn-ghost" style={{ marginTop:8 }}>← BACK TO HOME</a>
    </div>
  );

  if (phase === 'name')    return <NameEntry isHost={isHost} onStart={handleNameSubmit} />;
  if (phase === 'lobby')   return <Lobby code={code} hostName={playerName} onStart={() => setPhase('playing')} />;
  if (phase === 'waiting') return <WaitingScreen code={code} playerName={playerName} />;
  if (phase === 'playing') return <BingoGame onDone={handleGameDone} />;

  // phase === 'done'
  return (
    <div style={{
      minHeight:'100vh',
      backgroundImage:'url(/background/f1-bg.jpg)',
      backgroundSize:'cover', backgroundPosition:'center',
      padding:'24px 18px 64px',
    }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <SharePanel code={code} showQR={false} />
        <Leaderboard results={results} currentPlayer={playerName} />
        <div style={{ display:'flex', justifyContent:'center', gap:28, marginTop:18 }}>
          <a href={`/room/${code}`} className="btn-ghost">↺ PLAY AGAIN</a>
          <a href="/" className="btn-ghost">+ NEW ROOM</a>
        </div>
      </div>
    </div>
  );
}