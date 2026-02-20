'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
} as const;

const F  = "'Barlow Condensed','Arial Narrow',sans-serif";
const FM = "'Titillium Web','Segoe UI',sans-serif";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateSeed(): string {
  return Math.random().toString(36).substring(2, 18);
}

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode]     = useState('');
  const [loading, setLoading]       = useState<'create' | 'join' | null>(null);
  const [error, setError]           = useState('');

  async function handleCreate() {
    setLoading('create');
    setError('');
    const code = generateCode();
    const seed = generateSeed();

    const { error: err } = await supabase
      .from('rooms')
      .insert({ code, seed });

    if (err) {
      setError('Failed to create room. Please try again.');
      setLoading(null);
      return;
    }

    router.push(`/room/${code}`);
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError('Please enter a room code.'); return; }
    setLoading('join');
    setError('');

    const { data, error: err } = await supabase
      .from('rooms')
      .select('code')
      .eq('code', code)
      .single();

    if (err || !data) {
      setError(`Room "${code}" not found. Check the code and try again.`);
      setLoading(null);
      return;
    }

    router.push(`/room/${code}`);
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 18px',
      fontFamily: FM,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&family=Titillium+Web:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: ${C.chrome} !important; }
        .btn-red:hover  { box-shadow: 0 0 32px ${C.red}80  !important; transform: translateY(-1px); }
        .btn-dark:hover { box-shadow: 0 0 20px rgba(0,0,0,0.8) !important; border-color: ${C.chrome} !important; }
        .solo-btn:hover { box-shadow: 0 0 20px ${C.amber}40 !important; border-color: ${C.amber}80 !important; }
        button { transition: all 0.18s ease; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              background: C.red, padding: '4px 14px',
              clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',
              fontFamily: F, fontWeight: 900, fontSize: '1.4rem', letterSpacing: '0.1em', color: C.white,
              boxShadow: `0 0 20px ${C.red}60`,
            }}>F1</div>
            <h1 style={{ fontFamily: F, fontWeight: 900, fontSize: '3.2rem', letterSpacing: '0.14em', color: C.white, lineHeight: 1 }}>
              BINGO
            </h1>
          </div>
          <p style={{ fontFamily: FM, fontSize: '1rem', color: C.chrome, letterSpacing: '0.08em' }}>
            Test your Formula 1 knowledge
          </p>
        </div>

        {/* Main card */}
        <div style={{
          background: `linear-gradient(155deg, ${C.iron} 0%, ${C.steel} 100%)`,
          border: `1px solid ${C.bolt}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 48px rgba(0,0,0,0.85)`,
          overflow: 'hidden',
        }}>

          {/* Top red bar */}
          <div style={{ height: 3, background: C.red, boxShadow: `0 0 16px ${C.red}70` }} />

          <div style={{ padding: '32px 32px 28px' }}>

            {/* CREATE ROOM */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: F, fontWeight: 900, fontSize: '0.7rem',
                letterSpacing: '0.28em', color: C.dim, textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                ▶ CREATE A PRIVATE ROOM
              </div>
              <p style={{ fontFamily: FM, fontSize: '0.9rem', color: C.chrome, marginBottom: 14, lineHeight: 1.5 }}>
                Start a new room and share the code with your friends. Everyone plays the same categories.
              </p>
              <button
                className="btn-red"
                onClick={handleCreate}
                disabled={loading !== null}
                style={{
                  width: '100%', padding: '13px 0',
                  fontFamily: F, fontWeight: 900, fontSize: '1rem', letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: C.white,
                  background: loading === 'create' ? `${C.red}80` : C.red,
                  border: 'none', cursor: loading !== null ? 'not-allowed' : 'pointer',
                  clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)',
                  boxShadow: `0 0 20px ${C.red}40`,
                }}
              >
                {loading === 'create' ? '⏳ CREATING...' : '🏁 CREATE ROOM'}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{ flex: 1, height: 1, background: C.bolt }} />
              <span style={{ fontFamily: F, fontSize: '0.75rem', letterSpacing: '0.2em', color: C.dim }}>OR</span>
              <div style={{ flex: 1, height: 1, background: C.bolt }} />
            </div>

            {/* JOIN ROOM */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: F, fontWeight: 900, fontSize: '0.7rem',
                letterSpacing: '0.28em', color: C.dim, textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                ▶ JOIN A ROOM
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="ENTER CODE"
                  maxLength={6}
                  style={{
                    flex: 1, padding: '11px 16px',
                    fontFamily: F, fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.3em',
                    background: C.deep, border: `1px solid ${C.bolt}`,
                    color: C.white, textTransform: 'uppercase',
                    transition: 'border-color 0.15s',
                  }}
                />
                <button
                  className="btn-dark"
                  onClick={handleJoin}
                  disabled={loading !== null}
                  style={{
                    padding: '11px 22px',
                    fontFamily: F, fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    background: C.plate, border: `1px solid ${C.bolt}`, color: C.silver,
                    cursor: loading !== null ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading === 'join' ? '...' : 'JOIN'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '8px 14px', marginBottom: 20,
                background: `${C.redLo}cc`, border: `1px solid ${C.red}30`,
                borderLeft: `3px solid ${C.red}`,
                fontFamily: FM, fontSize: '0.88rem', color: '#ff9080',
              }}>
                {error}
              </div>
            )}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: C.bolt }} />
              <span style={{ fontFamily: F, fontSize: '0.75rem', letterSpacing: '0.2em', color: C.dim }}>OR</span>
              <div style={{ flex: 1, height: 1, background: C.bolt }} />
            </div>

            {/* SOLO */}
            <a href="/solo" style={{ textDecoration: 'none' }}>
              <button
                className="solo-btn"
                style={{
                  width: '100%', padding: '11px 0',
                  fontFamily: F, fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: C.chrome,
                  background: 'transparent',
                  border: `1px solid ${C.bolt}`,
                  cursor: 'pointer',
                  boxShadow: 'none',
                }}
              >
                🏎 PLAY SOLO
              </button>
            </a>

          </div>
        </div>

        <p style={{ textAlign: 'center', fontFamily: FM, fontSize: '0.78rem', color: C.dim, marginTop: 18, letterSpacing: '0.06em' }}>
          Rooms are open forever — share the code anytime
        </p>
      </div>
    </div>
  );
}