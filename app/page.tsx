'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
  redLo:     '#2a0008',
  green:     '#00d68f',
} as const;

const FD = "var(--font-display,'Bebas Neue',sans-serif)";
const FE = "var(--font-editorial,'Cormorant Garamond',Georgia,serif)";
const FM = "var(--font-mono,'Barlow Condensed','Arial Narrow',sans-serif)";

function generateCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
function generateSeed() { return Math.random().toString(36).substring(2, 18); }

// ─── Decorative background ────────────────────────────────────────────────────
function BgLayer() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232,0,45,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 85% 5%,  rgba(201,168,76,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 10% 80%, rgba(168,131,42,0.04) 0%, transparent 60%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: '48%',
        width: 1, height: '100%',
        background: `linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.12) 30%, rgba(232,0,45,0.18) 65%, transparent 100%)`,
        transform: 'skewX(-8deg)',
        filter: 'blur(1px)',
      }} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [loading,  setLoading]  = useState<'create' | 'join' | null>(null);
  const [error,    setError]    = useState('');

  async function handleCreate() {
    setLoading('create');
    setError('');
    const code = generateCode();
    const seed = generateSeed();
    const { error: err } = await supabase.from('rooms').insert({ code, seed });
    if (err) { setError('Failed to create room. Please try again.'); setLoading(null); return; }
    router.push(`/room/${code}`);
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError('Please enter a room code.'); return; }
    setLoading('join');
    setError('');
    const { data, error: err } = await supabase.from('rooms').select('code').eq('code', code).single();
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
      background: G.void,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 18px',
      fontFamily: FM,
      position: 'relative',
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.6); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus { outline: none; }
        .cta:hover        { box-shadow: 0 0 52px rgba(232,0,45,0.65) !important; transform: translateY(-2px) !important; }
        .cta:active       { transform: scale(0.987) translateY(0) !important; }
        .join-btn:hover   { background: rgba(201,168,76,0.1) !important; border-color: ${G.goldMid} !important; color: ${G.goldLight} !important; }
        .solo-btn:hover   { border-color: ${G.bolt} !important; color: ${G.silver} !important; background: rgba(255,255,255,0.02) !important; }
        .back-hub:hover   { color: rgba(255,255,255,0.9) !important; border-color: rgba(255,255,255,0.25) !important; }
        button { transition: all 0.18s ease; }
      `}</style>

      <BgLayer />

      {/* ── BACK TO HUB ──────────────────────────────────────────────── */}
      <a
        href="https://majestic-klepon-6a326d.netlify.app"
        className="back-hub"
        style={{
          position: 'fixed', top: 16, left: 18, zIndex: 100,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: FM, fontWeight: 700, fontSize: '0.72rem',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '7px 14px',
          background: 'rgba(5,5,7,0.7)',
          textDecoration: 'none',
          transition: 'all 0.18s',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        All Games
      </a>

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 2 }}>

        {/* ── LOGO ──────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 40, animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 16px', marginBottom: 24,
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.15)',
            fontFamily: FM, fontSize: '0.62rem', fontWeight: 700,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: G.goldMid,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: G.red, display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
            2026 Season · Now Live
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.12em', marginBottom: 14 }}>
            <div style={{ position: 'relative', display: 'inline-flex', marginRight: '0.08em' }}>
              <span style={{
                fontFamily: FD, fontSize: 'clamp(3rem,9vw,5rem)',
                lineHeight: 1, color: G.white,
                position: 'relative', zIndex: 1, padding: '0 0.14em',
              }}>F1</span>
              <div style={{
                position: 'absolute', inset: '4px 0',
                background: G.red,
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                zIndex: 0,
                boxShadow: '0 0 32px rgba(232,0,45,0.5)',
              }} />
            </div>
            <span style={{
              fontFamily: FD,
              fontSize: 'clamp(3rem,9vw,5rem)',
              lineHeight: 1, letterSpacing: '0.08em',
              background: `linear-gradient(135deg, ${G.goldSheen} 0%, ${G.goldLight} 30%, ${G.goldMid} 65%, ${G.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>BINGO</span>
          </div>

          <p style={{
            fontFamily: FE, fontStyle: 'italic', fontWeight: 300,
            fontSize: '1.05rem', color: G.chrome, letterSpacing: '0.05em',
          }}>
            The&nbsp;<em style={{ color: G.goldMid, fontStyle: 'normal' }}>ultimate</em>&nbsp;Formula 1 knowledge challenge
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px auto 0', maxWidth: 320 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${G.goldDim})` }} />
            <div style={{ width: 5, height: 5, background: G.goldDim, transform: 'rotate(45deg)' }} />
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${G.goldDim})` }} />
          </div>
        </div>

        {/* ── MAIN CARD ───────────────────────────────────────────── */}
        <div style={{
          background: `linear-gradient(155deg, ${G.gunmetal} 0%, ${G.jet} 60%, ${G.slate} 100%)`,
          border: `1px solid ${G.bolt}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.9)`,
          overflow: 'hidden', position: 'relative',
          animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.12s both',
        }}>
          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${G.goldDim} 20%, ${G.goldMid} 50%, ${G.goldDim} 80%, transparent)`,
          }} />
          {[
            { top: 8, left: 8,    borderWidth: '1px 0 0 1px' } as React.CSSProperties,
            { top: 8, right: 8,   borderWidth: '1px 1px 0 0' } as React.CSSProperties,
            { bottom: 8, left: 8, borderWidth: '0 0 1px 1px' } as React.CSSProperties,
            { bottom: 8, right: 8,borderWidth: '0 1px 1px 0' } as React.CSSProperties,
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', width: 14, height: 14,
              borderColor: G.goldDim, borderStyle: 'solid',
              opacity: 0.5, ...s,
            }} />
          ))}

          <div style={{ padding: '32px 32px 28px' }}>

            {/* ── CREATE ROOM ─────────────────────────────────────── */}
            <div style={{ marginBottom: 26 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                fontFamily: FM, fontSize: '0.6rem', fontWeight: 700,
                letterSpacing: '0.3em', textTransform: 'uppercase', color: G.goldDim,
              }}>
                <div style={{ width: 14, height: 1, background: G.goldDim }} />
                Create a Private Room
              </div>
              <p style={{
                fontFamily: FE, fontStyle: 'italic', fontWeight: 300,
                fontSize: '0.97rem', color: G.chrome,
                lineHeight: 1.65, marginBottom: 18,
              }}>
                Start a new room and share the code with your friends. Everyone plays the same categories.
              </p>
              <button
                className="cta"
                onClick={handleCreate}
                disabled={loading !== null}
                style={{
                  width: '100%', padding: '15px 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: FM, fontWeight: 900, fontSize: '0.95rem',
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: G.white,
                  background: loading === 'create' ? 'rgba(232,0,45,0.6)' : G.red,
                  border: 'none', cursor: loading !== null ? 'not-allowed' : 'pointer',
                  clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
                  boxShadow: `0 0 28px rgba(232,0,45,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {loading === 'create'
                  ? <><span style={{ width: 13, height: 13, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: G.white, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Creating Room...</>
                  : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.85 }}>
                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M7 17v-4M5 15h4"/>
                      </svg>
                      Create Room
                    </>
                }
              </button>
            </div>

            {/* ── OR ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '0 0 26px' }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${G.bolt})` }} />
              <span style={{ fontFamily: FM, fontSize: '0.62rem', letterSpacing: '0.24em', color: G.dim, textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${G.bolt})` }} />
            </div>

            {/* ── JOIN ROOM ───────────────────────────────────────── */}
            <div style={{ marginBottom: 26 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                fontFamily: FM, fontSize: '0.6rem', fontWeight: 700,
                letterSpacing: '0.3em', textTransform: 'uppercase', color: G.goldDim,
              }}>
                <div style={{ width: 14, height: 1, background: G.goldDim }} />
                Join a Room
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter code"
                  maxLength={6}
                  style={{
                    flex: 1, padding: '12px 16px',
                    fontFamily: FM, fontWeight: 900, fontSize: '1.25rem',
                    letterSpacing: '0.3em', textTransform: 'uppercase',
                    background: G.abyss, border: `1px solid ${G.bolt}`,
                    color: G.ivory, outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = G.goldDim; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(168,131,42,0.08)`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = G.bolt; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  className="join-btn"
                  onClick={handleJoin}
                  disabled={loading !== null}
                  style={{
                    padding: '12px 22px',
                    fontFamily: FM, fontWeight: 800, fontSize: '0.85rem',
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    background: 'rgba(201,168,76,0.06)',
                    border: `1px solid ${G.goldDim}`,
                    color: G.goldMid,
                    cursor: loading !== null ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading === 'join' ? '...' : 'Join'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', marginBottom: 18,
                background: 'rgba(42,0,8,0.9)',
                border: `1px solid rgba(232,0,45,0.15)`,
                borderLeft: `3px solid ${G.red}`,
                fontFamily: FE, fontStyle: 'italic', fontSize: '0.92rem', color: '#ff9080',
              }}>
                {error}
              </div>
            )}

            {/* ── OR ──────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '0 0 22px' }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${G.bolt})` }} />
              <span style={{ fontFamily: FM, fontSize: '0.62rem', letterSpacing: '0.24em', color: G.dim, textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${G.bolt})` }} />
            </div>

            {/* ── PLAY SOLO ───────────────────────────────────────── */}
            <a href="/solo" style={{ textDecoration: 'none' }}>
              <button
                className="solo-btn"
                style={{
                  width: '100%', padding: '12px 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: FM, fontWeight: 700, fontSize: '0.85rem',
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: G.dim, background: 'transparent',
                  border: `1px solid rgba(58,58,82,0.6)`,
                  cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Play Solo
              </button>
            </a>

          </div>
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: FE, fontStyle: 'italic', fontWeight: 300,
          fontSize: '0.8rem', color: G.dim,
          marginTop: 20, letterSpacing: '0.04em',
          animation: 'fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.3s both',
        }}>
          Rooms persist indefinitely — share the code anytime
        </p>
      </div>
    </div>
  );
}