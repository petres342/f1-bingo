'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase, RoomResult } from '@/lib/supabase';
import BingoGame from '@/components/BingoGame';

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

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

// ─── SHARE PANEL ────────────────────────────────────────────────────────────
function SharePanel({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${code}`
    : `/room/${code}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      background: `linear-gradient(155deg, ${C.iron}, ${C.steel})`,
      border: `1px solid ${C.bolt}`,
      padding: '14px 18px',
      marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontFamily: F, fontSize: '0.65rem', letterSpacing: '0.26em', color: C.dim, textTransform: 'uppercase', marginBottom: 4 }}>
          🔗 ROOM LINK — SHARE WITH FRIENDS
        </div>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: '1rem', color: C.chrome, letterSpacing: '0.04em', wordBreak: 'break-all' }}>
          {url}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {/* Room code badge */}
        <div style={{
          padding: '8px 16px',
          background: C.deep, border: `1px solid ${C.bolt}`,
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: F, fontSize: '0.6rem', letterSpacing: '0.24em', color: C.dim, textTransform: 'uppercase', marginBottom: 2 }}>CODE</div>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: '1.4rem', letterSpacing: '0.2em', color: C.white }}>{code}</div>
        </div>
        {/* Copy button */}
        <button
          onClick={copy}
          style={{
            padding: '8px 18px',
            fontFamily: F, fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.14em',
            textTransform: 'uppercase',
            background: copied ? `${C.green}20` : C.plate,
            border: `1px solid ${copied ? C.green : C.bolt}`,
            color: copied ? C.green : C.silver,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ COPIED!' : '📋 COPY'}
        </button>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function Leaderboard({ results, currentPlayer }: { results: RoomResult[]; currentPlayer: string }) {
  // Sort: highest score first, then fastest time
  const sorted = [...results].sort((a, b) =>
    b.score !== a.score ? b.score - a.score : a.total_time - b.total_time
  );

  return (
    <div style={{
      background: `linear-gradient(155deg, ${C.iron}, ${C.steel})`,
      border: `1px solid ${C.bolt}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 48px rgba(0,0,0,0.85)`,
      overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: C.red, boxShadow: `0 0 16px ${C.red}70` }} />

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${C.bolt}`,
        display: 'flex', alignItems: 'center', gap: 10,
        background: C.deep,
      }}>
        <div style={{
          background: C.red, padding: '2px 10px',
          clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
          fontFamily: F, fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.1em', color: C.white,
          boxShadow: `0 0 12px ${C.red}50`,
        }}>F1</div>
        <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.12em', color: C.white }}>
          ROOM LEADERBOARD
        </h2>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 1fr 60px 80px 70px',
        gap: '0 10px', alignItems: 'center',
        padding: '6px 20px',
        borderBottom: `1px solid ${C.bolt}`,
        background: `${C.deep}80`,
      }}>
        {['POS', 'PLAYER', 'SCORE', 'TIME', 'STREAK'].map(h => (
          <div key={h} style={{ fontFamily: F, fontSize: '0.62rem', letterSpacing: '0.24em', color: C.dim, textTransform: 'uppercase' }}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', fontFamily: FM, color: C.dim, fontSize: '0.9rem' }}>
          No results yet. Be the first to finish!
        </div>
      ) : (
        sorted.map((r, i) => {
          const isMe = r.player_name === currentPlayer;
          const rank = i + 1;
          return (
            <div
              key={r.id ?? i}
              style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 60px 80px 70px',
                gap: '0 10px', alignItems: 'center',
                padding: '10px 20px',
                borderBottom: `1px solid ${C.bolt}20`,
                background: isMe
                  ? `${C.blue}10`
                  : rank === 1 ? `${C.amber}06` : 'transparent',
                borderLeft: isMe ? `3px solid ${C.blue}` : '3px solid transparent',
                transition: 'background 0.3s',
              }}
            >
              {/* Position */}
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: '1.1rem', color: rank <= 3 ? C.amber : C.dim }}>
                {getMedal(rank)}
              </div>
              {/* Name */}
              <div style={{
                fontFamily: F, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.04em',
                color: isMe ? C.blue : C.silver,
                textTransform: 'uppercase',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {r.player_name} {isMe && <span style={{ fontSize: '0.7rem', color: `${C.blue}80`, letterSpacing: '0.1em' }}>(YOU)</span>}
              </div>
              {/* Score */}
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: '1.2rem', color: C.green }}>
                {r.score}<span style={{ fontSize: '0.75rem', color: C.dim }}>/15</span>
              </div>
              {/* Time */}
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: '0.95rem', color: C.chrome }}>
                ⏱ {formatTime(r.total_time)}
              </div>
              {/* Streak */}
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: '0.95rem', color: r.best_streak >= 3 ? C.amber : C.dim }}>
                {r.best_streak >= 2 ? `🔥 ${r.best_streak}×` : `${r.best_streak}×`}
              </div>
            </div>
          );
        })
      )}

      {/* Footer note */}
      <div style={{
        padding: '10px 20px',
        fontFamily: FM, fontSize: '0.78rem', color: C.dim,
        borderTop: `1px solid ${C.bolt}`,
        background: `${C.deep}80`,
        textAlign: 'center',
      }}>
        Sorted by score, then fastest time · Updates live as others finish
      </div>
    </div>
  );
}

// ─── NAME ENTRY SCREEN ───────────────────────────────────────────────────────
function NameEntry({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your name.'); return; }
    if (trimmed.length > 20) { setError('Name must be 20 characters or less.'); return; }
    onStart(trimmed);
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&family=Titillium+Web:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: ${C.chrome} !important; }
      `}</style>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{
          background: `linear-gradient(155deg, ${C.iron}, ${C.steel})`,
          border: `1px solid ${C.bolt}`,
          boxShadow: `0 8px 48px rgba(0,0,0,0.85)`,
          overflow: 'hidden',
        }}>
          <div style={{ height: 3, background: C.red, boxShadow: `0 0 16px ${C.red}70` }} />
          <div style={{ padding: '32px 32px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{
                background: C.red, padding: '2px 9px',
                clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
                fontFamily: F, fontWeight: 900, fontSize: '1rem', color: C.white,
                boxShadow: `0 0 12px ${C.red}50`,
              }}>F1</div>
              <h1 style={{ fontFamily: F, fontWeight: 900, fontSize: '1.8rem', letterSpacing: '0.12em', color: C.white }}>
                BINGO
              </h1>
            </div>

            <div style={{ fontFamily: F, fontSize: '0.65rem', letterSpacing: '0.28em', color: C.dim, textTransform: 'uppercase', marginBottom: 8 }}>
              ▶ ENTER YOUR NAME TO START
            </div>
            <p style={{ fontFamily: FM, fontSize: '0.88rem', color: C.chrome, marginBottom: 20, lineHeight: 1.5 }}>
              Your name will appear on the leaderboard after you finish.
            </p>

            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="Your name..."
              maxLength={20}
              autoFocus
              style={{
                width: '100%', padding: '12px 16px',
                fontFamily: FM, fontSize: '1rem',
                background: C.deep, border: `1px solid ${C.bolt}`,
                color: C.white, marginBottom: 12,
                transition: 'border-color 0.15s',
              }}
            />

            {error && (
              <div style={{
                padding: '7px 12px', marginBottom: 12,
                background: `${C.redLo}cc`, border: `1px solid ${C.red}30`,
                borderLeft: `3px solid ${C.red}`,
                fontFamily: FM, fontSize: '0.85rem', color: '#ff9080',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              style={{
                width: '100%', padding: '13px 0',
                fontFamily: F, fontWeight: 900, fontSize: '1rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', color: C.white,
                background: C.red, border: 'none', cursor: 'pointer',
                clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)',
                boxShadow: `0 0 20px ${C.red}40`,
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 36px ${C.red}70`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 20px ${C.red}40`)}
            >
              🏁 START RACE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ROOM PAGE ───────────────────────────────────────────────────────────
export default function RoomPage() {
  const params  = useParams();
  const code    = (params.code as string).toUpperCase();

  const [phase, setPhase]         = useState<'loading' | 'not-found' | 'name' | 'playing' | 'done'>('loading');
  const [playerName, setPlayerName] = useState('');
  const [results, setResults]     = useState<RoomResult[]>([]);
  const [seed, setSeed]           = useState('');

  // Load room on mount
  useEffect(() => {
    async function loadRoom() {
      const { data, error } = await supabase
        .from('rooms')
        .select('code, seed')
        .eq('code', code)
        .single();

      if (error || !data) { setPhase('not-found'); return; }
      setSeed(data.seed);
      setPhase('name');
    }
    loadRoom();
  }, [code]);

  // Load + subscribe to results
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'done') return;

    async function loadResults() {
      const { data } = await supabase
        .from('room_results')
        .select('*')
        .eq('room_code', code)
        .order('score', { ascending: false });
      if (data) setResults(data);
    }

    loadResults();

    // Real-time subscription — updates leaderboard live as others finish
    const channel = supabase
      .channel(`room-${code}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_results',
        filter: `room_code=eq.${code}`,
      }, () => { loadResults(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [code, phase]);

  async function handleGameDone(score: number, totalTime: number, bestStreak: number) {
    const result: RoomResult = {
      room_code: code,
      player_name: playerName,
      score,
      total_time: totalTime,
      best_streak: bestStreak,
    };
    await supabase.from('room_results').insert(result);
    setPhase('done');
  }

  // ── STATES ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: F, fontSize: '1.2rem', letterSpacing: '0.2em', color: C.dim }}>LOADING ROOM...</div>
      </div>
    );
  }

  if (phase === 'not-found') {
    return (
      <div style={{ minHeight: '100vh', background: C.black, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: '2rem', letterSpacing: '0.1em', color: C.red }}>ROOM NOT FOUND</div>
        <div style={{ fontFamily: FM, color: C.chrome }}>Room <b style={{ color: C.white }}>{code}</b> doesn&apos;t exist.</div>
        <a href="/" style={{ fontFamily: F, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.16em', color: C.blue, textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Back to Home
        </a>
      </div>
    );
  }

  if (phase === 'name') {
    return <NameEntry onStart={name => { setPlayerName(name); setPhase('playing'); }} />;
  }

  if (phase === 'playing') {
    return (
      <div>
        <BingoGame roomSeed={seed} onDone={handleGameDone} />
      </div>
    );
  }

  // phase === 'done'
  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      padding: '28px 18px 64px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&family=Titillium+Web:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <SharePanel code={code} />
        <Leaderboard results={results} currentPlayer={playerName} />
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{
            fontFamily: F, fontWeight: 700, fontSize: '0.85rem',
            letterSpacing: '0.16em', color: C.dim,
            textDecoration: 'none', textTransform: 'uppercase',
          }}>
            ← CREATE A NEW ROOM
          </a>
        </div>
      </div>
    </div>
  );
}