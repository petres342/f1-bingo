'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase, RoomResult } from '@/lib/supabase';
import BingoGame from '@/components/BingoGame';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  black:  '#06060f',
  deep:   '#0b0b18',
  steel:  '#10101e',
  iron:   '#171728',
  plate:  '#1e1e32',
  bolt:   '#2a2a44',
  dim:    '#52527a',
  chrome: '#8888b8',
  silver: '#c4c4e0',
  white:  '#eeeeff',
  red:    '#e8002d',
  redLo:  '#380010',
  green:  '#00e676',
  amber:  '#ffb300',
  blue:   '#1e90ff',
} as const;

const F  = "'Barlow Condensed','Arial Narrow',sans-serif";
const FM = "'Titillium Web','Segoe UI',sans-serif";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&family=Titillium+Web:wght@300;400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.black}; }
  input:focus { outline: none !important; border-color: ${C.chrome} !important; }
  a { text-decoration: none; }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.8); }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes count-in {
    from { opacity: 0; transform: scale(1.4); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes countdown-ring {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: 163; }
  }
  .anim-fade { animation: fade-in 0.4s ease both; }
  .anim-count { animation: count-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
  .btn-red    { transition: box-shadow 0.2s, transform 0.15s; }
  .btn-red:hover    { box-shadow: 0 0 36px ${C.red}70 !important; transform: translateY(-1px); }
  .btn-red:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
  .btn-dark   { transition: all 0.15s; }
  .btn-dark:hover   { border-color: ${C.chrome} !important; color: ${C.white} !important; }
  .player-row { transition: background 0.3s; }
`;

const PANEL: React.CSSProperties = {
  background: `linear-gradient(155deg, ${C.iron} 0%, ${C.steel} 100%)`,
  border: `1px solid ${C.bolt}`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 48px rgba(0,0,0,0.85)`,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `P${rank}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE  — pure SVG, no external library needed
// Uses a minimal QR encoding for URLs via the free goqr.me API image endpoint,
// rendered as an <img> (works offline too since it's just a URL param).
// ─────────────────────────────────────────────────────────────────────────────
function QRCode({ url, size = 160 }: { url: string; size?: number }) {
  // We draw the QR using the Google Chart API (no key needed, widely available)
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=0b0b18&color=c4c4e0&margin=2`;
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${C.bolt}`,
      overflow: 'hidden',
      flexShrink: 0,
      background: C.deep,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="QR Code" width={size} height={size} style={{ display: 'block' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARE + QR PANEL  (shown in lobby and results)
// ─────────────────────────────────────────────────────────────────────────────
function SharePanel({ code, showQR = true }: { code: string; showQR?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl]       = useState(`/room/${code}`);

  useEffect(() => {
    setUrl(`${window.location.origin}/room/${code}`);
  }, [code]);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div style={{ ...PANEL, overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ height: 3, background: C.red, boxShadow: `0 0 14px ${C.red}70` }} />
      <div style={{ padding: '18px 20px', display: 'flex', gap: 18, alignItems: 'stretch', flexWrap: 'wrap' }}>

        {/* QR Code */}
        {showQR && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <QRCode url={url} size={144} />
            <div style={{ fontFamily: F, fontSize: '0.6rem', letterSpacing: '0.2em', color: C.dim, textTransform: 'uppercase' }}>
              SCAN TO JOIN
            </div>
          </div>
        )}

        {/* Info column */}
        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
          {/* Room code hero */}
          <div>
            <div style={{ fontFamily: F, fontSize: '0.62rem', letterSpacing: '0.28em', color: C.dim, textTransform: 'uppercase', marginBottom: 6 }}>
              ▶ ROOM CODE
            </div>
            <div style={{
              fontFamily: F, fontWeight: 900, fontSize: '3rem', letterSpacing: '0.28em',
              color: C.white, lineHeight: 1,
              textShadow: `0 0 30px ${C.white}15`,
            }}>
              {code}
            </div>
          </div>

          {/* URL row + copy */}
          <div>
            <div style={{ fontFamily: F, fontSize: '0.62rem', letterSpacing: '0.28em', color: C.dim, textTransform: 'uppercase', marginBottom: 6 }}>
              ▶ SHARE LINK
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{
                flex: 1, padding: '8px 12px',
                background: C.deep, border: `1px solid ${C.bolt}`,
                fontFamily: FM, fontSize: '0.8rem', color: C.chrome,
                wordBreak: 'break-all', lineHeight: 1.4,
              }}>
                {url}
              </div>
              <button
                className="btn-dark"
                onClick={copy}
                style={{
                  flexShrink: 0, padding: '8px 14px',
                  fontFamily: F, fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  background: copied ? `${C.green}18` : C.plate,
                  border: `1px solid ${copied ? C.green : C.bolt}`,
                  color: copied ? C.green : C.silver,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
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
// LOBBY — shown to creator while waiting, with player list + Start button
// ─────────────────────────────────────────────────────────────────────────────
type LobbyPlayer = { id: string; player_name: string; joined_at: string };

function Lobby({
  code, hostName, onStart,
}: {
  code: string;
  hostName: string;
  onStart: () => void;
}) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [starting, setStarting] = useState(false);

  // Load + subscribe to lobby players
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_code', code)
        .order('joined_at', { ascending: true });
      if (data) setPlayers(data);
    }
    load();

    const ch = supabase.channel(`lobby-${code}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_players',
        filter: `room_code=eq.${code}`,
      }, load)
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
      minHeight: '100vh',
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      padding: '24px 18px 48px',
    }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>

        <SharePanel code={code} />

        {/* Lobby panel */}
        <div style={{ ...PANEL, overflow: 'hidden' }}>
          <div style={{ height: 2, background: C.bolt }} />
          <div style={{ padding: '20px 22px' }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: F, fontSize: '0.62rem', letterSpacing: '0.28em', color: C.dim, textTransform: 'uppercase', marginBottom: 4 }}>
                  ▶ LOBBY
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: '1.6rem', letterSpacing: '0.1em', color: C.white }}>
                    WAITING FOR PLAYERS
                  </h2>
                  {/* Pulsing dot */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: C.green, opacity: 0.7,
                        animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Player count badge */}
              <div style={{
                padding: '6px 16px', background: C.deep,
                border: `1px solid ${C.bolt}`, textAlign: 'center',
              }}>
                <div style={{ fontFamily: F, fontWeight: 900, fontSize: '2rem', lineHeight: 1, color: count >= 2 ? C.green : C.amber }}>
                  {count}
                </div>
                <div style={{ fontFamily: F, fontSize: '0.6rem', letterSpacing: '0.2em', color: C.dim, textTransform: 'uppercase' }}>
                  PLAYERS
                </div>
              </div>
            </div>

            {/* Player list */}
            <div style={{ border: `1px solid ${C.bolt}`, overflow: 'hidden', marginBottom: 20 }}>
              {players.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontFamily: FM, color: C.dim, fontSize: '0.88rem' }}>
                  No players yet — share the code above!
                </div>
              ) : (
                players.map((p, i) => (
                  <div
                    key={p.id}
                    className="player-row anim-fade"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      borderBottom: i < players.length - 1 ? `1px solid ${C.bolt}30` : 'none',
                      background: p.player_name === hostName ? `${C.red}08` : 'transparent',
                      borderLeft: p.player_name === hostName ? `3px solid ${C.red}` : '3px solid transparent',
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${C.plate}, ${C.bolt})`,
                      border: `1px solid ${C.bolt}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: F, fontWeight: 900, fontSize: '0.85rem',
                      color: C.chrome, flexShrink: 0,
                    }}>
                      {p.player_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{
                      fontFamily: F, fontWeight: 700, fontSize: '1rem',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: p.player_name === hostName ? C.silver : C.chrome,
                    }}>
                      {p.player_name}
                    </div>
                    {p.player_name === hostName && (
                      <div style={{
                        marginLeft: 'auto',
                        fontFamily: F, fontSize: '0.62rem', letterSpacing: '0.2em',
                        color: C.red, textTransform: 'uppercase',
                        background: `${C.red}15`, border: `1px solid ${C.red}30`,
                        padding: '2px 8px',
                      }}>
                        HOST
                      </div>
                    )}
                    {/* Joined indicator */}
                    <div style={{
                      marginLeft: p.player_name === hostName ? 0 : 'auto',
                      width: 7, height: 7, borderRadius: '50%',
                      background: C.green,
                      boxShadow: `0 0 6px ${C.green}80`,
                    }} />
                  </div>
                ))
              )}
            </div>

            {/* Start button */}
            <button
              className="btn-red"
              onClick={handleStart}
              disabled={starting || count < 1}
              style={{
                width: '100%', padding: '14px 0',
                fontFamily: F, fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.18em',
                textTransform: 'uppercase', color: C.white,
                background: C.red, border: 'none', cursor: 'pointer',
                clipPath: 'polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)',
                boxShadow: `0 0 24px ${C.red}45`,
              }}
            >
              {starting ? '⏳ STARTING...' : `🏁 START RACE — ${count} PLAYER${count !== 1 ? 'S' : ''}`}
            </button>

            {count < 2 && (
              <p style={{ textAlign: 'center', fontFamily: FM, fontSize: '0.78rem', color: C.dim, marginTop: 10 }}>
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
// WAITING SCREEN  (shown to non-host while waiting for start)
// ─────────────────────────────────────────────────────────────────────────────
function WaitingScreen({ code, playerName }: { code: string; playerName: string }) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [dots, setDots]       = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('room_players').select('*')
        .eq('room_code', code)
        .order('joined_at', { ascending: true });
      if (data) setPlayers(data);
    }
    load();
    const ch = supabase.channel(`waiting-${code}-${playerName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_code=eq.${code}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [code, playerName]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ ...PANEL, overflow: 'hidden' }}>
          <div style={{ height: 3, background: C.red, boxShadow: `0 0 16px ${C.red}70` }} />
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>

            {/* F1 Logo */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{
                background: C.red, padding: '2px 10px',
                clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
                fontFamily: F, fontWeight: 900, fontSize: '1rem', color: C.white,
                boxShadow: `0 0 12px ${C.red}50`,
              }}>F1</div>
              <span style={{ fontFamily: F, fontWeight: 900, fontSize: '1.6rem', letterSpacing: '0.14em', color: C.white }}>BINGO</span>
            </div>

            {/* Spinner */}
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
              <svg width={80} height={80} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx={40} cy={40} r={26} fill="none" stroke={`${C.red}20`} strokeWidth={3} />
                <circle cx={40} cy={40} r={26} fill="none" stroke={C.red} strokeWidth={3}
                  strokeDasharray="163" strokeLinecap="round"
                  style={{ animation: 'spin 1.4s linear infinite', transformOrigin: '40px 40px', filter: `drop-shadow(0 0 4px ${C.red}80)` }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: F, fontWeight: 900, fontSize: '1.8rem', color: C.white,
              }}>🏎</div>
            </div>

            <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.1em', color: C.white, marginBottom: 6 }}>
              WAITING FOR HOST{dots}
            </h2>
            <p style={{ fontFamily: FM, fontSize: '0.9rem', color: C.chrome, marginBottom: 24 }}>
              The race will start when <span style={{ color: C.white }}>the host</span> presses Start
            </p>

            {/* Your name badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', marginBottom: 24,
              background: C.deep, border: `1px solid ${C.bolt}`,
              borderLeft: `3px solid ${C.green}`,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}80` }} />
              <span style={{ fontFamily: F, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.1em', color: C.silver, textTransform: 'uppercase' }}>
                {playerName}
              </span>
              <span style={{ fontFamily: F, fontSize: '0.65rem', letterSpacing: '0.16em', color: C.dim }}>READY</span>
            </div>

            {/* Players in room */}
            {players.length > 0 && (
              <div style={{ textAlign: 'left', border: `1px solid ${C.bolt}`, overflow: 'hidden' }}>
                <div style={{
                  padding: '5px 12px', background: `${C.deep}80`,
                  borderBottom: `1px solid ${C.bolt}`,
                  fontFamily: F, fontSize: '0.6rem', letterSpacing: '0.24em', color: C.dim, textTransform: 'uppercase',
                }}>
                  {players.length} PLAYER{players.length !== 1 ? 'S' : ''} IN ROOM
                </div>
                {players.map((p, i) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    borderBottom: i < players.length - 1 ? `1px solid ${C.bolt}20` : 'none',
                    background: p.player_name === playerName ? `${C.green}08` : 'transparent',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
                    <span style={{
                      fontFamily: F, fontWeight: 700, fontSize: '0.92rem',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: p.player_name === playerName ? C.green : C.chrome,
                    }}>
                      {p.player_name} {p.player_name === playerName ? '(you)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p style={{ textAlign: 'center', fontFamily: FM, fontSize: '0.75rem', color: C.dim, marginTop: 14 }}>
          Room code: <span style={{ color: C.silver, letterSpacing: '0.14em', fontFamily: F, fontWeight: 700 }}>{code}</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAME ENTRY
// ─────────────────────────────────────────────────────────────────────────────
function NameEntry({ onStart, isHost }: { onStart: (name: string) => void; isHost: boolean }) {
  const [name, setName]   = useState('');
  const [error, setError] = useState('');

  function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your name.'); return; }
    if (trimmed.length > 20) { setError('Max 20 characters.'); return; }
    onStart(trimmed);
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ ...PANEL, overflow: 'hidden' }}>
          <div style={{ height: 3, background: C.red, boxShadow: `0 0 16px ${C.red}70` }} />
          <div style={{ padding: '32px 28px 28px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                background: C.red, padding: '2px 9px',
                clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
                fontFamily: F, fontWeight: 900, fontSize: '1rem', color: C.white,
                boxShadow: `0 0 12px ${C.red}50`,
              }}>F1</div>
              <h1 style={{ fontFamily: F, fontWeight: 900, fontSize: '1.8rem', letterSpacing: '0.12em', color: C.white }}>BINGO</h1>
            </div>

            <p style={{ fontFamily: FM, fontSize: '0.85rem', color: C.dim, marginBottom: 22, letterSpacing: '0.04em' }}>
              {isHost ? 'Enter your name — you\'ll host this room' : 'Enter your name to join the room'}
            </p>

            <div style={{ fontFamily: F, fontSize: '0.62rem', letterSpacing: '0.28em', color: C.dim, textTransform: 'uppercase', marginBottom: 8 }}>
              ▶ YOUR NAME
            </div>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="e.g. Max Verstappen"
              maxLength={20}
              autoFocus
              style={{
                width: '100%', padding: '12px 14px',
                fontFamily: FM, fontSize: '1rem',
                background: C.deep, border: `1px solid ${C.bolt}`,
                color: C.white, marginBottom: error ? 8 : 16,
                transition: 'border-color 0.15s',
              }}
            />

            {error && (
              <div style={{
                padding: '7px 12px', marginBottom: 14,
                background: `${C.redLo}cc`, border: `1px solid ${C.red}30`,
                borderLeft: `3px solid ${C.red}`,
                fontFamily: FM, fontSize: '0.85rem', color: '#ff9080',
              }}>{error}</div>
            )}

            <button
              className="btn-red"
              onClick={handleStart}
              style={{
                width: '100%', padding: '13px 0',
                fontFamily: F, fontWeight: 900, fontSize: '1rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', color: C.white,
                background: C.red, border: 'none', cursor: 'pointer',
                clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)',
                boxShadow: `0 0 20px ${C.red}40`,
              }}
            >
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
function Leaderboard({ results, currentPlayer }: { results: RoomResult[]; currentPlayer: string }) {
  const sorted = [...results].sort((a, b) =>
    b.score !== a.score ? b.score - a.score : a.total_time - b.total_time
  );

  return (
    <div style={{ ...PANEL, overflow: 'hidden' }}>
      <div style={{ height: 3, background: C.red, boxShadow: `0 0 16px ${C.red}70` }} />

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.bolt}`, display: 'flex', alignItems: 'center', gap: 10, background: C.deep }}>
        <div style={{
          background: C.red, padding: '2px 10px',
          clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
          fontFamily: F, fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.1em', color: C.white,
          boxShadow: `0 0 12px ${C.red}50`,
        }}>F1</div>
        <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.12em', color: C.white }}>
          RACE RESULTS
        </h2>
        {/* Live dot */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
          <span style={{ fontFamily: F, fontSize: '0.6rem', letterSpacing: '0.2em', color: C.dim, textTransform: 'uppercase' }}>LIVE</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '44px 1fr 70px 90px 70px',
        padding: '5px 20px', borderBottom: `1px solid ${C.bolt}`, background: `${C.deep}80`,
      }}>
        {['POS', 'PLAYER', 'SCORE', 'TIME', 'STREAK'].map(h => (
          <div key={h} style={{ fontFamily: F, fontSize: '0.6rem', letterSpacing: '0.24em', color: C.dim, textTransform: 'uppercase' }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', fontFamily: FM, color: C.dim, fontSize: '0.88rem' }}>
          No results yet — be the first to finish!
        </div>
      ) : sorted.map((r, i) => {
        const isMe = r.player_name === currentPlayer;
        const rank = i + 1;
        return (
          <div key={r.id ?? i} className="player-row" style={{
            display: 'grid', gridTemplateColumns: '44px 1fr 70px 90px 70px',
            padding: '10px 20px',
            borderBottom: `1px solid ${C.bolt}20`,
            background: isMe ? `${C.blue}10` : rank === 1 ? `${C.amber}05` : 'transparent',
            borderLeft: isMe ? `3px solid ${C.blue}` : '3px solid transparent',
            animation: 'fade-in 0.35s ease both',
            animationDelay: `${i * 0.06}s`,
          }}>
            <div style={{ fontFamily: F, fontWeight: 900, fontSize: '1.05rem', color: rank <= 3 ? C.amber : C.dim }}>
              {getMedal(rank)}
            </div>
            <div style={{
              fontFamily: F, fontWeight: 700, fontSize: '0.95rem',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: isMe ? C.blue : C.silver,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {r.player_name}
              {isMe && <span style={{ fontSize: '0.65rem', color: `${C.blue}70`, marginLeft: 6 }}>(YOU)</span>}
            </div>
            <div style={{ fontFamily: F, fontWeight: 900, fontSize: '1.1rem', color: C.green }}>
              {r.score}<span style={{ fontSize: '0.7rem', color: C.dim }}>/15</span>
            </div>
            <div style={{ fontFamily: F, fontSize: '0.88rem', color: C.chrome }}>
              ⏱ {formatTime(r.total_time)}
            </div>
            <div style={{ fontFamily: F, fontSize: '0.88rem', color: r.best_streak >= 3 ? C.amber : C.dim }}>
              {r.best_streak >= 2 ? `🔥 ${r.best_streak}×` : `${r.best_streak}×`}
            </div>
          </div>
        );
      })}

      <div style={{
        padding: '8px 20px', borderTop: `1px solid ${C.bolt}`, background: `${C.deep}80`,
        fontFamily: FM, fontSize: '0.74rem', color: C.dim, textAlign: 'center',
      }}>
        Sorted by score · tiebreak by fastest time · updates live
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

  // ── LOAD ROOM ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('rooms')
        .select('code, seed, started, host_name')
        .eq('code', code)
        .single();

      if (error || !data) { setPhase('not-found'); return; }
      setSeed(data.seed);

      // If already started, go straight to playing (late joiners)
      if (data.started) { setPhase('name'); return; }
      setPhase('name');
    }
    load();
  }, [code]);

  // ── WATCH FOR GAME START (for non-host waiting players) ───────────────────
  const watchStartRef = useRef(false);
  const startWatcher = useCallback(() => {
    if (watchStartRef.current) return;
    watchStartRef.current = true;

    const ch = supabase.channel(`start-watch-${code}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms',
        filter: `code=eq.${code}`,
      }, payload => {
        if (payload.new?.started) setPhase('playing');
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [code]);

  // ── LOAD + SUBSCRIBE RESULTS ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'done') return;

    async function loadResults() {
      const { data } = await supabase
        .from('room_results').select('*')
        .eq('room_code', code)
        .order('score', { ascending: false });
      if (data) setResults(data);
    }
    loadResults();

    const ch = supabase.channel(`results-${code}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'room_results',
        filter: `room_code=eq.${code}`,
      }, loadResults)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [code, phase]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  async function handleNameSubmit(name: string) {
    setPlayerName(name);

    // Register player in lobby
    await supabase.from('room_players').insert({ room_code: code, player_name: name });

    // Check if room already started (late joiner)
    const { data } = await supabase.from('rooms').select('started, host_name').eq('code', code).single();

    if (data?.started) {
      // Late joiner — go straight to game
      setPhase('playing');
      return;
    }

    // First person to register becomes host
    const isFirstPlayer = !data?.host_name;
    if (isFirstPlayer) {
      await supabase.from('rooms').update({ host_name: name }).eq('code', code);
      setIsHost(true);
      setPhase('lobby');
    } else {
      setIsHost(false);
      setPhase('waiting');
      startWatcher();
    }
  }

  async function handleGameDone(score: number, totalTime: number, bestStreak: number) {
    await supabase.from('room_results').insert({
      room_code: code,
      player_name: playerName,
      score,
      total_time: totalTime,
      best_streak: bestStreak,
    });
    setPhase('done');
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.bolt}`, borderTopColor: C.red, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <div style={{ fontFamily: F, fontSize: '1rem', letterSpacing: '0.2em', color: C.dim }}>LOADING ROOM...</div>
      </div>
    </div>
  );

  if (phase === 'not-found') return (
    <div style={{ minHeight: '100vh', background: C.black, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: '2rem', letterSpacing: '0.1em', color: C.red }}>ROOM NOT FOUND</div>
      <div style={{ fontFamily: FM, color: C.chrome, textAlign: 'center' }}>Room <b style={{ color: C.white }}>{code}</b> doesn&apos;t exist or has expired.</div>
      <a href="/" style={{ fontFamily: F, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.16em', color: C.blue, textTransform: 'uppercase', marginTop: 8 }}>
        ← BACK TO HOME
      </a>
    </div>
  );

  if (phase === 'name') return (
    <NameEntry isHost={isHost} onStart={handleNameSubmit} />
  );

  if (phase === 'lobby') return (
    <Lobby code={code} hostName={playerName} onStart={() => setPhase('playing')} />
  );

  if (phase === 'waiting') return (
    <WaitingScreen code={code} playerName={playerName} />
  );

  if (phase === 'playing') return (
    <BingoGame roomSeed={seed} onDone={handleGameDone} />
  );

  // phase === 'done'
  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      padding: '24px 18px 64px',
    }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <SharePanel code={code} showQR={false} />
        <Leaderboard results={results} currentPlayer={playerName} />
        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 24 }}>
          <a href={`/room/${code}`} style={{ fontFamily: F, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.16em', color: C.chrome, textTransform: 'uppercase' }}>
            ↺ PLAY AGAIN IN THIS ROOM
          </a>
          <a href="/" style={{ fontFamily: F, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.16em', color: C.dim, textTransform: 'uppercase' }}>
            + NEW ROOM
          </a>
        </div>
      </div>
    </div>
  );
}