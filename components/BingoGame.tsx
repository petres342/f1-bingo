'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Driver, Category } from '@/types';
import { allDrivers } from '@/data/drivers';
import { generateDailyCategories } from '@/data/categories';
import {
  Clock, SkipForward, RotateCcw,
  CheckCircle2, XCircle, MinusCircle, Flame,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  black:  '#080808',
  deep:   '#0d0d0d',
  steel:  '#131313',
  iron:   '#191919',
  plate:  '#202020',
  bolt:   '#2a2a2a',
  dim:    '#4a4540',
  chrome: '#a89880',
  silver: '#d4c9b8',
  white:  '#f5f0e8',
  red:    '#e10600',
  redLo:  '#420100',
  green:  '#00d98b',
  amber:  '#f5b800',
} as const;

const F  = "var(--font-barlow-condensed),'Barlow Condensed',sans-serif";
const FM = "var(--font-titillium-web),'Titillium Web',sans-serif";

const PANEL: React.CSSProperties = {
  background: `linear-gradient(155deg,${C.iron} 0%,${C.steel} 100%)`,
  border: `1px solid ${C.bolt}`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.025),0 4px 28px rgba(0,0,0,0.75)`,
};

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE  (all random() lives inside buildGame — never at module level)
// ─────────────────────────────────────────────────────────────────────────────
interface ToastData { name: string; category: string }

interface GS {
  categories: Category[];
  drivers:    Driver[];
  idx:        number;
  correct:    Set<string>;
  wrong:      Set<string>;
  assigned:   Map<string, Driver>;
  streak:     number;
  best:       number;
  time:       number;
  done:       boolean;
  toast:      ToastData | null;
}

function buildGame(): GS {
  const categories = generateDailyCategories();
  const drivers    = [...allDrivers].sort(() => Math.random() - 0.5).slice(0, 60);
  return {
    categories, drivers, idx: 0,
    correct: new Set(), wrong: new Set(), assigned: new Map(),
    streak: 0, best: 0, time: 10, done: false, toast: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TINY ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function Rivets() {
  const dot: React.CSSProperties = {
    position: 'absolute', width: 5, height: 5, borderRadius: '50%',
    background: `radial-gradient(circle at 35% 35%,${C.dim},${C.bolt})`,
    border: `1px solid ${C.bolt}`,
  };
  return (
    <>
      <span style={{ ...dot, top: 6, left: 6 }} />
      <span style={{ ...dot, top: 6, right: 6 }} />
      <span style={{ ...dot, bottom: 6, left: 6 }} />
      <span style={{ ...dot, bottom: 6, right: 6 }} />
    </>
  );
}

function Pill({ children, bg = C.red, fg = C.white, style }: {
  children: React.ReactNode; bg?: string; fg?: string; style?: React.CSSProperties;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 11px',
      background: bg, color: fg, fontFamily: F, fontWeight: 900,
      fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase',
      clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMER BAR (green → amber → red)
// ─────────────────────────────────────────────────────────────────────────────
function TimerBar({ t }: { t: number }) {
  const pct   = (t / 10) * 100;
  const color = t <= 3 ? C.red : t <= 6 ? C.amber : C.green;
  return (
    <div style={{ height: 3, background: C.bolt, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color, boxShadow: `0 0 8px ${color}90`,
        transition: 'width 1s linear, background 0.5s',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WRONG TOAST — slides in/out, no alert()
// ─────────────────────────────────────────────────────────────────────────────
function WrongToast({ toast }: { toast: ToastData | null }) {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<ToastData | null>(null);

  useEffect(() => {
    if (toast) {
      setData(toast);
      const id = setTimeout(() => setShow(true), 16);
      return () => clearTimeout(id);
    }
    setShow(false);
  }, [toast]);

  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: show ? 54 : 0,
      opacity: show ? 1 : 0,
      marginBottom: show ? 8 : 0,
      transition: 'max-height 0.25s ease, opacity 0.25s ease, margin-bottom 0.25s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        background: `${C.redLo}f0`,
        border: `1px solid ${C.red}35`,
        borderLeft: `3px solid ${C.red}`,
      }}>
        <XCircle size={13} style={{ color: C.red, flexShrink: 0 }} />
        <span style={{ fontFamily: FM, fontSize: '0.95rem', fontWeight: 600, color: C.silver, letterSpacing: '0.04em' }}>
          <b style={{ color: C.white, fontFamily: F, fontWeight: 900 }}>{data?.name}</b>
          {' '}does not fit in{' '}
          <span style={{ color: '#f0a090', fontStyle: 'italic' }}>{data?.category}</span>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAK FLASH — fixed toast in corner on 2+ streak
// ─────────────────────────────────────────────────────────────────────────────
function StreakFlash({ streak }: { streak: number }) {
  const [visible, setVisible] = useState(false);
  const prev = useRef(0);

  useEffect(() => {
    if (streak >= 2 && streak > prev.current) {
      setVisible(true);
      const id = setTimeout(() => setVisible(false), 2000);
      prev.current = streak;
      return () => clearTimeout(id);
    }
    if (streak === 0) prev.current = 0;
  }, [streak]);

  return (
    <div style={{
      position: 'fixed', top: 72, right: 22, zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 16px',
      background: C.deep,
      border: `1px solid ${C.amber}55`,
      borderLeft: `3px solid ${C.amber}`,
      boxShadow: `0 6px 32px rgba(0,0,0,0.85)`,
      pointerEvents: 'none',
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
    }}>
      <Flame size={15} style={{ color: C.amber }} />
      <span style={{ fontFamily: F, fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.14em', color: C.amber }}>
        {streak}× STREAK
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON (shown on server + before client hydration)
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ minHeight: '100vh', background: C.black, padding: '26px 18px' }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0 }
          100% { background-position:  400px 0 }
        }
        .sk { background: linear-gradient(90deg,${C.iron} 25%,${C.plate} 50%,${C.iron} 75%);
              background-size: 400px 100%; animation: shimmer 1.4s infinite; }
      `}</style>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ height: 3, background: C.redLo, marginBottom: 10 }} />
        <div className="sk" style={{ height: 56, marginBottom: 10, border: `1px solid ${C.bolt}` }} />
        <div className="sk" style={{ height: 162, marginBottom: 8, border: `1px solid ${C.bolt}` }} />
        <div style={{ height: 2, background: C.bolt, marginBottom: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="sk" style={{ aspectRatio: '1/1', border: `1px solid ${C.bolt}` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY BG
// ─────────────────────────────────────────────────────────────────────────────
function catBg(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('sprint wins'))         return '/categories/sprint.jpg';
  if (t.includes('race wins'))           return '/categories/victory.jpg';
  if (t.includes('pole positions'))      return '/categories/pole.jpg';
  if (t.includes('podiums'))             return '/categories/podium.jpg';
  if (t.includes('grand slams'))         return '/categories/grand-slam.jpg';
  if (t.includes('race starts'))         return '/categories/starts.jpg';
  if (t.includes('championship titles')) return '/categories/champion.jpg';
  if (t.includes('fastest laps'))        return '/categories/fastest-lap.jpg';
  if (t.includes('born in the'))         return '/categories/decade-generic.jpg';
  if (t.includes('born in'))             return '/categories/decade-generic.jpg';
  if (t.includes('driver from'))         return '/categories/generic.jpg';
  if (t.includes('points scored'))       return '/categories/points.jpg';
  if (t.includes('driver of the day'))   return '/categories/dotd.jpg';
  if (t.includes('finished top'))        return '/categories/champion.jpg';
  if (t.includes('laps completed'))      return '/categories/starts.jpg';
  return '/categories/default-f1.jpg';
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function Results({ gs, onRestart }: { gs: GS; onRestart: () => void }) {
  const { categories, correct, wrong, assigned, best } = gs;
  const score = correct.size;
  const total = categories.length;
  const pct   = Math.round((score / total) * 100);

  const tier =
    pct === 100 ? { label: 'BINGO CONFIRMED', color: C.green,  sub: 'Perfect performance. You know F1 like no one else.' } :
    pct >= 80   ? { label: 'PODIUM FINISH',   color: C.green,  sub: 'Almost perfect. A better pit stop next time.' } :
    pct >= 60   ? { label: 'POINTS FINISH',   color: C.amber,  sub: 'Solid. Strategy can still be improved.' } :
    pct >= 40   ? { label: 'MIDFIELD',        color: C.amber,  sub: 'Not all is lost — there\'s a whole season ahead.' } :
                  { label: 'DNF',             color: C.red,    sub: 'Retired from the race. Study the telemetry harder.' };

  const correctList  = categories.filter(c => correct.has(c.id));
  const wrongList    = categories.filter(c => wrong.has(c.id));
  const skippedList  = categories.filter(c => !correct.has(c.id) && !wrong.has(c.id));

  const groups = [
    { list: correctList,  icon: <CheckCircle2 size={12} style={{ color: C.green }} />, accent: C.green, label: `Correct (${correctList.length})` },
    { list: wrongList,    icon: <XCircle      size={12} style={{ color: C.red   }} />, accent: C.red,   label: `Wrong (${wrongList.length})`    },
    { list: skippedList,  icon: <MinusCircle  size={12} style={{ color: C.dim   }} />, accent: C.dim,   label: `Skipped (${skippedList.length})` },
  ].filter(g => g.list.length > 0);

  // Animate progress bar after mount
  const [barW, setBarW] = useState(0);
  useEffect(() => { const id = setTimeout(() => setBarW(pct), 80); return () => clearTimeout(id); }, [pct]);

  return (
    <div style={{
      minHeight: '100vh', background: C.black,
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      padding: '36px 18px 64px', overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 700 }}>

        {/* Accent bar */}
        <div style={{ height: 4, background: C.red, boxShadow: `0 0 18px ${C.red}70`, borderRadius: '2px 2px 0 0' }} />

        <div style={{ ...PANEL, position: 'relative', padding: '28px 32px 32px' }}>
          <Rivets />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{
                background: C.red, padding: '3px 10px',
                clipPath: 'polygon(7px 0%,100% 0%,calc(100% - 7px) 100%,0% 100%)',
                fontFamily: F, fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.1em', color: C.white,
              }}>F1</div>
              <h1 style={{ fontFamily: F, fontWeight: 900, fontSize: '1.8rem', letterSpacing: '0.1em', color: C.white, margin: 0 }}>
                BINGO — RESULTS
              </h1>
            </div>
          </div>

          {/* Score hero */}
          <div style={{
            background: C.deep, border: `1px solid ${C.bolt}`,
            borderLeft: `4px solid ${tier.color}`,
            padding: '18px 22px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 22,
          }}>
            <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 68 }}>
              <div style={{
                fontFamily: F, fontWeight: 900, fontSize: '4.6rem', lineHeight: 1,
                color: tier.color, textShadow: `0 0 26px ${tier.color}45`,
              }}>{score}</div>
              <div style={{ fontFamily: F, fontWeight: 700, fontSize: '1.02rem', color: C.chrome, letterSpacing: '0.1em' }}>/ {total}</div>
            </div>

            <div style={{ width: 1, alignSelf: 'stretch', background: C.bolt }} />

            <div style={{ flex: 1 }}>
              <Pill bg={tier.color} style={{ marginBottom: 8 }}>{tier.label}</Pill>
              <p style={{ fontFamily: FM, fontSize: '1.1rem', color: C.silver, margin: '0 0 14px', lineHeight: 1.4 }}>
                {tier.sub}
              </p>
              <div style={{ background: C.bolt, height: 5, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%', width: `${barW}%`,
                  background: `linear-gradient(90deg,${tier.color}70,${tier.color})`,
                  boxShadow: `0 0 10px ${tier.color}55`,
                  transition: 'width 1.5s cubic-bezier(0.22,1,0.36,1)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: F, fontSize: '0.75rem', letterSpacing: '0.2em', color: C.chrome }}>
                  {pct}% SUCCESS RATE
                </span>
                {best >= 2 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: F, fontSize: '0.75rem', letterSpacing: '0.16em', color: C.amber }}>
                    <Flame size={10} /> BEST STREAK: {best}×
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 14 }}>
            {[
              { label: 'Correct', val: correctList.length,  color: C.green  },
              { label: 'Wrong',   val: wrongList.length,    color: C.red    },
              { label: 'Skipped', val: skippedList.length,  color: C.chrome },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: C.deep, border: `1px solid ${C.bolt}`, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: F, fontWeight: 900, fontSize: '2rem', lineHeight: 1, color }}>{val}</div>
                <div style={{ fontFamily: F, fontSize: '1.1rem', letterSpacing: '0.2em', color: C.chrome, marginTop: 3 }}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Team radio */}
          <div style={{
            background: C.deep, border: `1px solid ${C.bolt}`,
            padding: '8px 14px', marginBottom: 18,
            fontFamily: FM, fontSize: '1.05rem', color: C.silver, lineHeight: 1.5,
          }}>
            <div style={{ fontFamily: F, fontSize: '1.1rem', letterSpacing: '0.22em', color: C.chrome, marginBottom: 5 }}>
              ▶ TEAM RADIO — RACE ENGINEER
            </div>
            {score === total ? (
              <>
                <p style={{ margin: '0 0 2px' }}>„Guys… guys… is this Bingo confirmed?"</p>
                <p style={{ margin: 0 }}>„Copy. <span style={{ color: C.green }}>Bingo confirmed.</span> Box, box for celebration!"</p>
              </>
            ) : score >= total * 0.8 ? (
              <p style={{ margin: 0 }}>„Good session. <span style={{ color: C.amber }}>Almost there.</span> We'll debrief and come back stronger."</p>
            ) : (
              <>
                <p style={{ margin: '0 0 2px' }}>„We had Bingo?"</p>
                <p style={{ margin: 0 }}>„<span style={{ color: C.red }}>Negative.</span> Wrong strategy. Box, we need to talk."</p>
              </>
            )}
            <audio autoPlay>
              <source src={score === total ? '/audio/bingo-confirmed.mp3' : '/audio/fail-radio.mp3'} type="audio/mpeg" />
            </audio>
          </div>

          {/* Category breakdown — grouped */}
          <div style={{ border: `1px solid ${C.bolt}`, overflow: 'hidden', marginBottom: 26 }}>
            {groups.map((g, gi) => (
              <div key={gi}>
                {/* Group row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px',
                  background: `${g.accent}0d`,
                  borderBottom: `1px solid ${C.bolt}`,
                  borderTop: gi > 0 ? `1px solid ${C.bolt}` : 'none',
                }}>
                  {g.icon}
                  <span style={{ fontFamily: F, fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.22em', color: `${g.accent}bb` }}>
                    {g.label.toUpperCase()}
                  </span>
                </div>
                {/* Category rows */}
                {g.list.map((cat, i) => {
                  const drv    = assigned.get(cat.id);
                  const isC    = correct.has(cat.id);
                  const isW    = wrong.has(cat.id);
                  const accent = isC ? C.green : isW ? C.red : C.dim;
                  return (
                    <div key={cat.id} style={{
                      display: 'grid', gridTemplateColumns: '20px 34px 1fr auto',
                      gap: '0 10px', alignItems: 'center',
                      padding: '7px 12px',
                      borderBottom: i < g.list.length - 1 ? `1px solid ${C.bolt}30` : 'none',
                      background: isC ? `${C.green}06` : isW ? `${C.red}06` : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {isC ? <CheckCircle2 size={13} style={{ color: C.green }} />
                          : isW ? <XCircle size={13} style={{ color: C.red }} />
                          : <MinusCircle size={13} style={{ color: C.dim }} />}
                      </div>
                      <div style={{ width: 34, height: 34, position: 'relative', overflow: 'hidden', border: `1px solid ${accent}55`, flexShrink: 0 }}>
                        {drv
                          ? <Image src={`/drivers/${drv.id}.jpg`} alt={drv.name} width={34} height={34} className="object-cover" style={{ display: 'block' }} />
                          : <div style={{ width: 34, height: 34, background: C.bolt }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: F, fontWeight: 700, fontSize: '0.98rem',
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                          color: isC ? C.green : isW ? '#f09080' : C.chrome,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{cat.text}</div>
                        <div style={{ fontFamily: F, fontSize: '1.1rem', letterSpacing: '0.1em', color: `${accent}80`, marginTop: 1 }}>
                          {isC ? 'CORRECT' : isW ? 'WRONG' : 'UNSELECTED'}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: F, fontWeight: 600, fontSize: '1.02rem',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        color: drv ? C.silver : C.dim,
                        whiteSpace: 'nowrap', textAlign: 'right',
                      }}>
                        {drv?.name ?? '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Replay CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onRestart}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: F, fontWeight: 900, fontSize: '0.95rem',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                background: C.red, color: C.white, border: 'none',
                padding: '13px 50px',
                clipPath: 'polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)',
                cursor: 'pointer', boxShadow: `0 0 22px ${C.red}35`,
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 32px ${C.red}60`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 22px ${C.red}35`)}
            >
              <RotateCcw size={14} /> Play again
            </button>
            {pct < 100 && (
              <p style={{ fontFamily: FM, fontSize: '1.1rem', color: C.chrome, margin: 0, letterSpacing: '0.04em' }}>
                Categories change every game — you can do better.
              </p>
            )}
            {pct === 100 && (
              <p style={{ fontFamily: FM, fontSize: '1.1rem', color: `${C.green}90`, margin: 0 }}>
                Perfect performance. Try again for a new set of categories.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function BingoGame() {
  // ── HYDRATION FIX ─────────────────────────────────────────────────────────
  // gs is null on server AND on first client render → both render <Skeleton />.
  // After mount, useEffect calls buildGame() (which uses Math.random()) only
  // on the client — no server/client mismatch possible.
  const [gs, setGs] = useState<GS | null>(null);

  useEffect(() => {
    setGs(buildGame());
  }, []);

  // ── TIMER ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gs || gs.done || gs.idx >= gs.drivers.length) return;
    if (gs.time <= 0) {
      setGs(prev => {
        if (!prev) return prev;
        const next = prev.idx + 1;
        return { ...prev, idx: next, time: 10, toast: null, done: next >= prev.drivers.length };
      });
      return;
    }
    const id = setTimeout(() => setGs(prev => prev ? { ...prev, time: prev.time - 1 } : prev), 1000);
    return () => clearTimeout(id);
  }, [gs?.time, gs?.done, gs?.idx, gs]);

  // ── TOAST DISMISS ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gs?.toast) return;
    const id = setTimeout(() => setGs(prev => prev ? { ...prev, toast: null } : prev), 2600);
    return () => clearTimeout(id);
  }, [gs?.toast]);

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    setGs(prev => {
      if (!prev || prev.done) return prev;
      const next = prev.idx + 1;
      return { ...prev, idx: next, time: 10, streak: 0, toast: null, done: next >= prev.drivers.length };
    });
  }, []);

  const handleAssign = useCallback((catId: string) => {
    setGs(prev => {
      if (!prev || prev.done) return prev;
      if (prev.correct.has(catId) || prev.wrong.has(catId)) return prev;
      const driver   = prev.drivers[prev.idx];
      const category = prev.categories.find(c => c.id === catId);
      if (!driver || !category) return prev;

      const hit        = category.matches(driver);
      const newCorrect = hit ? new Set([...prev.correct, catId]) : prev.correct;
      const newWrong   = hit ? prev.wrong : new Set([...prev.wrong, catId]);
      const newAssigned= new Map(prev.assigned).set(catId, driver);
      const streak     = hit ? prev.streak + 1 : 0;
      const best       = Math.max(prev.best, streak);
      const answered   = newCorrect.size + newWrong.size;
      const allDone    = answered >= prev.categories.length;
      const nextIdx    = allDone ? prev.idx : prev.idx + 1;
      const done       = allDone || nextIdx >= prev.drivers.length;

      return {
        ...prev,
        correct: newCorrect, wrong: newWrong, assigned: newAssigned,
        streak, best,
        idx: nextIdx, time: 10, done,
        toast: hit ? null : { name: driver.name, category: category.text },
      };
    });
  }, []);

  const handleRestart = useCallback(() => setGs(buildGame()), []);

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (!gs) return <Skeleton />;
  if (gs.done) return <Results gs={gs} onRestart={handleRestart} />;

  const driver    = gs.drivers[gs.idx];
  const answered  = gs.correct.size + gs.wrong.size;
  const remaining = gs.categories.length - answered;
  const tc        = gs.time <= 3;
  const tCol      = tc ? C.red : gs.time <= 6 ? C.amber : C.silver;

  return (
    <div style={{
      minHeight: '100vh', background: C.black,
      backgroundImage: 'url(/background/f1-bg.jpg)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      padding: '26px 18px 18px',
    }}>
      <StreakFlash streak={gs.streak} />

      <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: 10, gap: 10 }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 3, background: C.red, boxShadow: `0 0 12px ${C.red}60` }} />
            <div style={{ ...PANEL, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 11, flex: 1 }}>
              <div style={{
                background: C.red, padding: '2px 9px',
                clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
                fontFamily: F, fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.1em', color: C.white,
              }}>F1</div>
              <h1 style={{ fontFamily: F, fontWeight: 900, fontSize: '2.2rem', letterSpacing: '0.14em', color: C.white, margin: 0 }}>
                BINGO
              </h1>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Answered */}
            <div style={{ ...PANEL, padding: '8px 16px', position: 'relative' }}>
              <Rivets />
              <div style={{ fontFamily: F, fontSize: '1.1rem', letterSpacing: '0.22em', color: C.chrome, textTransform: 'uppercase', marginBottom: 1 }}>Answered</div>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: '2rem', lineHeight: 1, letterSpacing: '0.06em' }}>
                <span style={{ color: C.white }}>{answered}</span>
                <span style={{ color: C.bolt, fontSize: '1.3rem' }}>/{gs.categories.length}</span>
              </div>
            </div>
            {/* Remaining */}
            <div style={{ ...PANEL, padding: '8px 16px', position: 'relative' }}>
              <Rivets />
              <div style={{ fontFamily: F, fontSize: '1.1rem', letterSpacing: '0.22em', color: C.chrome, textTransform: 'uppercase', marginBottom: 1 }}>Remaining</div>
              <div style={{ fontFamily: F, fontWeight: 900, fontSize: '2rem', lineHeight: 1, letterSpacing: '0.06em', color: remaining <= 3 ? C.amber : C.chrome }}>
                {remaining}
              </div>
            </div>
            {/* Streak (only visible if active) */}
            {gs.streak >= 2 && (
              <div style={{ ...PANEL, padding: '8px 16px', position: 'relative', borderColor: `${C.amber}45` }}>
                <Rivets />
                <div style={{ fontFamily: F, fontSize: '1.1rem', letterSpacing: '0.22em', color: C.amber, textTransform: 'uppercase', marginBottom: 1 }}>Streak</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: F, fontWeight: 900, fontSize: '2rem', lineHeight: 1, color: C.amber }}>
                  {gs.streak}<Flame size={15} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── WRONG TOAST ─────────────────────────────────────────────────── */}
        <WrongToast toast={gs.toast} />

        {/* ── DRIVER CARD ─────────────────────────────────────────────────── */}
        {driver && (
          <div style={{ ...PANEL, marginBottom: 8, position: 'relative', overflow: 'hidden', display: 'flex' }}>
            <Rivets />

            {/* Red left rail */}
            <div style={{ width: 3, flexShrink: 0, background: C.red, boxShadow: `2px 0 12px ${C.red}50` }} />

            {/* Driver photo */}
            <div style={{ position: 'relative', width: 158, height: 158, flexShrink: 0 }}>
              <Image
                src={`/drivers/${driver.id}.jpg`}
                alt={driver.name}
                fill
                className="object-cover"
                style={{ borderRight: `1px solid ${C.bolt}` }}
                priority
                sizes="158px"
              />
              {/* CRT scanlines */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.05) 0px,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 3px)',
              }} />
            </div>

            {/* Driver info */}
            <div style={{ flex: 1, padding: '13px 18px 11px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <Pill style={{ marginBottom: 7 }}>Driver Identified</Pill>
                <h2 style={{ fontFamily: F, fontWeight: 900, fontSize: '2.9rem', letterSpacing: '0.02em', color: C.white, margin: 0, lineHeight: 1 }}>
                  {driver.name}
                </h2>
                <div style={{ fontFamily: FM, fontWeight: 400, fontSize: '1rem', letterSpacing: '0.14em', color: C.chrome, marginTop: 5, textTransform: 'uppercase' }}>
                  {driver.country ?? ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={handleSkip}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 12px',
                    fontFamily: F, fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.12em',
                    background: C.iron, border: `1px solid ${C.bolt}`, color: C.chrome,
                    cursor: 'pointer',
                    clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.silver; e.currentTarget.style.borderColor = C.dim; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.chrome; e.currentTarget.style.borderColor = C.bolt; }}
                >
                  <SkipForward size={10} /> SKIP
                </button>
                <span style={{ fontFamily: F, fontSize: '0.98rem', letterSpacing: '0.14em', color: C.bolt, textTransform: 'uppercase' }}>
                  Select a category
                </span>
              </div>
            </div>

            {/* Timer block */}
            <div style={{
              width: 88, flexShrink: 0,
              background: tc
                ? `repeating-linear-gradient(-45deg,${C.red} 0px,${C.red} 8px,${C.redLo} 8px,${C.redLo} 16px)`
                : C.deep,
              borderLeft: `1px solid ${C.bolt}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              transition: 'background 0.5s',
            }}>
              <Clock size={11} style={{ color: tCol, opacity: 0.5 }} />
              <div style={{
                fontFamily: F, fontWeight: 900, fontSize: '3.1rem', lineHeight: 1,
                color: tCol, textShadow: `0 0 14px ${tCol}65`,
                transition: 'color 0.4s',
              }}>
                {gs.time}
              </div>
              <div style={{ fontFamily: F, fontSize: '0.68rem', letterSpacing: '0.22em', color: tCol, opacity: 0.45, textTransform: 'uppercase' }}>SEC</div>
            </div>

            {/* Timer bar at bottom of card */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <TimerBar t={gs.time} />
            </div>
          </div>
        )}

        {/* Overall progress bar */}
        <div style={{ height: 2, background: C.bolt, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(answered / gs.categories.length) * 100}%`,
            background: `linear-gradient(90deg,${C.red}70,${C.red})`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* ── CATEGORY GRID ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
          {gs.categories.map(cat => {
            const done = gs.correct.has(cat.id) || gs.wrong.has(cat.id);
            const bg   = catBg(cat.text);
            return (
              <button
                key={cat.id}
                onClick={() => !done && handleAssign(cat.id)}
                disabled={done}
                style={{
                  position: 'relative', aspectRatio: '1/1',
                  padding: 0,
                  border: `1px solid ${done ? C.bolt + '30' : C.bolt}`,
                  overflow: 'hidden',
                  cursor: done ? 'default' : 'pointer',
                  opacity: done ? 0.25 : 1,
                  backgroundImage: `url(${bg})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  transition: 'opacity 0.4s, transform 0.12s ease',
                }}
                onMouseEnter={e => { if (!done) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                {/* Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.73)' }} />
                {/* CRT lines */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 4px)',
                }} />
                {/* Top accent strip */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: C.bolt }} />
                {/* Corner rivets */}
                {([{top:3,left:3},{top:3,right:3},{bottom:3,left:3},{bottom:3,right:3}] as React.CSSProperties[]).map((pos, i) => (
                  <span key={i} style={{ position:'absolute', width:4, height:4, borderRadius:'50%', background:C.bolt, opacity:0.5, ...pos }} />
                ))}
                {/* Label */}
                <div style={{
                  position: 'relative', zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', padding: '12px 7px',
                }}>
                  <span style={{
                    fontFamily: F, fontWeight: 800, fontSize: '1.02rem',
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    textAlign: 'center', lineHeight: 1.25,
                    color: C.silver,
                    textShadow: '0 1px 8px rgba(0,0,0,1)',
                  }}>
                    {cat.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}