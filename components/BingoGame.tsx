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
// TOKENS  — Luxury F1 palette
// ─────────────────────────────────────────────────────────────────────────────
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
  redLo:     '#2a0008',
  green:     '#00d68f',
  amber:     '#f5a623',
  blue:      '#2979ff',
} as const;

const FD = "var(--font-display,'Bebas Neue',sans-serif)";
const FE = "var(--font-editorial,'Cormorant Garamond',Georgia,serif)";
const FM = "var(--font-mono,'Barlow Condensed','Arial Narrow',sans-serif)";

const PANEL: React.CSSProperties = {
  background: `linear-gradient(155deg, ${G.gunmetal} 0%, ${G.jet} 60%, ${G.slate} 100%)`,
  border: `1px solid ${G.bolt}`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 32px rgba(0,0,0,0.8)`,
};

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE
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
  totalTime:  number;
}

function buildGame(): GS {
  const categories = generateDailyCategories();
  const drivers    = [...(allDrivers as Driver[])].sort(() => Math.random() - 0.5).slice(0, 60);
  return {
    categories, drivers, idx: 0,
    correct: new Set(), wrong: new Set(), assigned: new Map(),
    streak: 0, best: 0, time: 15, done: false, toast: null, totalTime: 0,
  };
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────

// Rivets — decorative corner bolts, kept from original
function Rivets() {
  const dot: React.CSSProperties = {
    position: 'absolute', width: 5, height: 5, borderRadius: '50%',
    background: `radial-gradient(circle at 35% 35%, ${G.dim}, ${G.bolt})`,
    border: `1px solid ${G.bolt}`,
  };
  return (
    <>
      <span style={{ ...dot, top: 6,    left: 6   }} />
      <span style={{ ...dot, top: 6,    right: 6  }} />
      <span style={{ ...dot, bottom: 6, left: 6   }} />
      <span style={{ ...dot, bottom: 6, right: 6  }} />
    </>
  );
}

// Pill — tag/badge chip with parallelogram clip
function Pill({ children, bg = G.red, fg = G.white, style }: {
  children: React.ReactNode;
  bg?: string;
  fg?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 13px',
      background: bg, color: fg,
      fontFamily: FM, fontWeight: 900,
      fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase',
      clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
      boxShadow: `0 0 14px ${bg}45`,
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMER RING — circular SVG countdown
// ─────────────────────────────────────────────────────────────────────────────
function TimerRing({ t }: { t: number }) {
  const r = 24, circ = 2 * Math.PI * r;
  const color = t <= 5 ? G.red : t <= 9 ? G.amber : G.goldMid;
  return (
    <div style={{ position: 'relative', width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={70} height={70} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={35} cy={35} r={r} fill="none" stroke={`rgba(58,58,82,0.6)`} strokeWidth={2.5} />
        <circle
          cx={35} cy={35} r={r} fill="none"
          stroke={color} strokeWidth={2.5}
          strokeDasharray={`${circ * (t / 15)} ${circ}`}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dasharray 1s linear, stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', lineHeight: 1 }}>
        <div style={{
          fontFamily: FD, fontSize: '1.7rem', color,
          transition: 'color 0.4s',
          textShadow: `0 0 12px ${color}60`,
        }}>{t}</div>
        <div style={{ fontFamily: FM, fontSize: '0.52rem', letterSpacing: '0.22em', color: `${color}70`, textTransform: 'uppercase' }}>sec</div>
      </div>
    </div>
  );
}

// Timer bar — bottom-of-card countdown strip
function TimerBar({ t }: { t: number }) {
  const pct   = (t / 15) * 100;
  const color = t <= 5 ? G.red : t <= 9 ? G.amber : G.goldMid;
  return (
    <div style={{ height: 2, background: G.bolt, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color, boxShadow: `0 0 8px ${color}80`,
        transition: 'width 1s linear, background 0.5s',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WRONG TOAST
// ─────────────────────────────────────────────────────────────────────────────
// Toast removed — no assignment feedback during game; answers revealed only in Results

// ─────────────────────────────────────────────────────────────────────────────
// STREAK FLASH
// ─────────────────────────────────────────────────────────────────────────────
function StreakFlash({ streak }: { streak: number }) {
  const [visible, setVisible] = useState(false);
  const prev = useRef(0);

  useEffect(() => {
    if (streak >= 2 && streak > prev.current) {
      setVisible(true);
      const id = setTimeout(() => setVisible(false), 2200);
      prev.current = streak;
      return () => clearTimeout(id);
    }
    if (streak === 0) prev.current = 0;
  }, [streak]);

  return (
    <div style={{
      position: 'fixed', top: 72, right: 22, zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 9, padding: '10px 18px',
      background: `linear-gradient(135deg, ${G.gunmetal}, ${G.abyss})`,
      border: `1px solid ${G.goldDim}`,
      borderLeft: `3px solid ${G.goldMid}`,
      boxShadow: `0 8px 40px rgba(0,0,0,0.9), 0 0 24px rgba(201,168,76,0.18)`,
      pointerEvents: 'none',
      transform: visible ? 'translateX(0)' : 'translateX(110%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
    }}>
      <Flame size={14} style={{ color: G.goldMid }} />
      <span style={{ fontFamily: FM, fontWeight: 900, fontSize: '1rem', letterSpacing: '0.16em', color: G.goldLight }}>
        {streak}× Streak
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ minHeight: '100vh', background: G.void, padding: '26px 18px' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-500px 0}100%{background-position:500px 0} }
        .sk {
          background: linear-gradient(90deg, ${G.gunmetal} 25%, ${G.iron} 50%, ${G.gunmetal} 75%);
          background-size: 500px 100%;
          animation: shimmer 1.6s infinite;
        }
      `}</style>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${G.goldDim}, transparent)`, marginBottom: 10 }} />
        <div className="sk" style={{ height: 58, marginBottom: 10, border: `1px solid ${G.bolt}` }} />
        <div className="sk" style={{ height: 160, marginBottom: 8, border: `1px solid ${G.bolt}` }} />
        <div style={{ height: 2, background: G.bolt, marginBottom: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="sk" style={{ aspectRatio: '1/1', border: `1px solid ${G.bolt}` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY HELPERS — icon + accent colour per category type
// ─────────────────────────────────────────────────────────────────────────────
function catIcon(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('championship titles')) return '🏆';
  if (t.includes('race wins'))           return '🏁';
  if (t.includes('sprint wins'))         return '⚡';
  if (t.includes('pole positions'))      return '🎯';
  if (t.includes('podiums'))             return '🥇';
  if (t.includes('grand slams'))         return '💎';
  if (t.includes('race starts'))         return '🔢';
  if (t.includes('fastest laps'))        return '⏱';
  if (t.includes('born in the'))         return '📅';
  if (t.includes('born in'))             return '🌍';
  if (t.includes('driver from'))         return '🌍';
  if (t.includes('points scored'))       return '📊';
  if (t.includes('driver of the day'))   return '⭐';
  if (t.includes('finished top'))        return '🏅';
  if (t.includes('laps completed'))      return '🔄';
  return '🏎';
}

function catAccentColor(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('championship'))  return G.goldMid;
  if (t.includes('race wins'))     return G.red;
  if (t.includes('sprint'))        return '#00bcd4';
  if (t.includes('pole'))          return G.green;
  if (t.includes('podiums'))       return G.amber;
  if (t.includes('grand slams'))   return '#e040fb';
  if (t.includes('fastest'))       return '#1e90ff';
  if (t.includes('born'))          return '#78909c';
  if (t.includes('driver from'))   return '#4caf50';
  if (t.includes('points'))        return '#ff7043';
  if (t.includes('driver of'))     return G.amber;
  if (t.includes('laps'))          return '#26c6da';
  return G.chrome;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS SCREEN — all original sections preserved + luxury styling
// ─────────────────────────────────────────────────────────────────────────────
function Results({ gs, onRestart, onDone }: {
  gs: GS;
  onRestart: () => void;
  onDone?: (score: number, totalTime: number, bestStreak: number) => void;
}) {
  const { categories, correct, wrong, assigned, best, totalTime } = gs;

  // Fire onDone once when component mounts (game just finished)
  const firedRef = useRef(false);
  useEffect(() => {
    if (!firedRef.current && onDone) {
      firedRef.current = true;
      onDone(correct.size, totalTime, best);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const score = correct.size;
  const total = categories.length;
  const pct   = Math.round((score / total) * 100);

  const tier =
    pct === 100 ? { label: 'BINGO CONFIRMED', color: G.green,   sub: 'Perfect performance. You know F1 like no one else.'             } :
    pct >= 80   ? { label: 'PODIUM FINISH',   color: G.green,   sub: 'Almost perfect. A sharper pit strategy next time.'              } :
    pct >= 60   ? { label: 'POINTS FINISH',   color: G.amber,   sub: 'Solid. Strategy can still be improved.'                        } :
    pct >= 40   ? { label: 'MIDFIELD',        color: G.amber,   sub: "Not all is lost — there's a whole season ahead."               } :
                  { label: 'DNF',             color: G.red,     sub: 'Retired from the race. Study the telemetry harder.'            };

  const correctList  = categories.filter(c => correct.has(c.id));
  const wrongList    = categories.filter(c => wrong.has(c.id));
  const skippedList  = categories.filter(c => !correct.has(c.id) && !wrong.has(c.id));

  const groups = [
    { list: correctList,  icon: <CheckCircle2 size={12} style={{ color: G.green }} />, accent: G.green, label: `Correct (${correctList.length})`  },
    { list: wrongList,    icon: <XCircle      size={12} style={{ color: G.red   }} />, accent: G.red,   label: `Wrong (${wrongList.length})`       },
    { list: skippedList,  icon: <MinusCircle  size={12} style={{ color: G.dim   }} />, accent: G.dim,   label: `Skipped (${skippedList.length})`   },
  ].filter(g => g.list.length > 0);

  const [barW, setBarW] = useState(0);
  useEffect(() => { const id = setTimeout(() => setBarW(pct), 80); return () => clearTimeout(id); }, [pct]);

  return (
    <div style={{
      minHeight: '100vh',
      background: G.void,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      padding: '36px 18px 64px', overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 700 }}>

        {/* Gold accent bar at very top */}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${G.goldDim} 15%, ${G.goldMid} 50%, ${G.goldDim} 85%, transparent)`,
          borderRadius: '1px 1px 0 0',
        }} />

        <div style={{ ...PANEL, position: 'relative', padding: '30px 32px 32px', overflow: 'hidden' }}>
          <Rivets />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* F1 badge */}
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <span style={{ fontFamily: FD, fontSize: '1.3rem', lineHeight: 1, color: G.white, position: 'relative', zIndex: 1, padding: '0 0.14em' }}>F1</span>
                <div style={{ position: 'absolute', inset: '2px 0', background: G.red, clipPath: 'polygon(8% 0%,100% 0%,92% 100%,0% 100%)', zIndex: 0, boxShadow: `0 0 14px rgba(232,0,45,0.55)` }} />
              </div>
              <h1 style={{ fontFamily: FD, fontSize: '1.9rem', letterSpacing: '0.08em', color: G.ivory, margin: 0 }}>
                BINGO — RESULTS
              </h1>
            </div>
          </div>

          {/* Score hero */}
          <div style={{
            background: G.abyss, border: `1px solid ${G.bolt}`,
            borderLeft: `4px solid ${tier.color}`,
            padding: '18px 22px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 22,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.02)`,
          }}>
            {/* Big score number */}
            <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 72 }}>
              <div style={{
                fontFamily: FD, fontSize: '4.8rem', lineHeight: 1,
                color: tier.color, textShadow: `0 0 32px ${tier.color}55`,
              }}>{score}</div>
              <div style={{ fontFamily: FM, fontWeight: 700, fontSize: '1rem', color: G.chrome, letterSpacing: '0.1em' }}>/ {total}</div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: G.bolt }} />
            <div style={{ flex: 1 }}>
              {/* Tier pill — using Pill component */}
              <Pill bg={tier.color} style={{ marginBottom: 10 }}>{tier.label}</Pill>
              <p style={{ fontFamily: FE, fontStyle: 'italic', fontWeight: 300, fontSize: '1.03rem', color: G.silver, margin: '0 0 14px', lineHeight: 1.6 }}>
                {tier.sub}
              </p>
              {/* Animated progress bar */}
              <div style={{ background: G.bolt, height: 5, overflow: 'hidden', marginBottom: 5, borderRadius: 2 }}>
                <div style={{
                  height: '100%', width: `${barW}%`,
                  background: `linear-gradient(90deg, ${tier.color}70, ${tier.color})`,
                  boxShadow: `0 0 10px ${tier.color}60`, borderRadius: 2,
                  transition: 'width 1.6s cubic-bezier(0.22,1,0.36,1)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontFamily: FM, fontSize: '0.72rem', letterSpacing: '0.18em', color: G.chrome }}>
                  {pct}% SUCCESS RATE
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FM, fontSize: '0.72rem', letterSpacing: '0.14em', color: G.chrome }}>
                  ⏱ TIME: {formatTime(totalTime)}
                </span>
                {best >= 2 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FM, fontSize: '0.72rem', letterSpacing: '0.14em', color: G.goldMid }}>
                    <Flame size={10} /> BEST STREAK: {best}×
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 14 }}>
            {[
              { label: 'Correct', val: correctList.length,  color: G.green  },
              { label: 'Wrong',   val: wrongList.length,    color: G.red    },
              { label: 'Skipped', val: skippedList.length,  color: G.chrome },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                background: G.abyss, border: `1px solid ${G.bolt}`,
                borderTop: `2px solid ${color}45`, padding: '10px 14px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: FD, fontSize: '2.2rem', lineHeight: 1, color, textShadow: `0 0 14px ${color}45` }}>{val}</div>
                <div style={{ fontFamily: FM, fontSize: '0.65rem', letterSpacing: '0.2em', color: G.chrome, marginTop: 3, textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
            {/* Total time — full-width row */}
            <div style={{ gridColumn: 'span 3', background: G.abyss, border: `1px solid ${G.bolt}`, borderTop: `2px solid rgba(41,121,255,0.45)`, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Clock size={15} style={{ color: G.blue, opacity: 0.85 }} />
              <span style={{ fontFamily: FD, fontSize: '2.2rem', lineHeight: 1, color: G.blue, textShadow: '0 0 14px rgba(41,121,255,0.4)' }}>{formatTime(totalTime)}</span>
              <span style={{ fontFamily: FM, fontSize: '0.65rem', letterSpacing: '0.2em', color: G.chrome, textTransform: 'uppercase' }}>Total Time</span>
            </div>
          </div>

          {/* Team radio — original section, kept intact */}
          <div style={{
            background: G.abyss, border: `1px solid ${G.bolt}`,
            borderLeft: `2px solid ${G.goldDim}`,
            padding: '10px 16px', marginBottom: 20,
            fontFamily: FE, fontStyle: 'italic', fontWeight: 300,
            fontSize: '0.97rem', color: G.silver, lineHeight: 1.65,
          }}>
            <div style={{ fontFamily: FM, fontSize: '0.58rem', letterSpacing: '0.26em', color: G.goldDim, marginBottom: 6, textTransform: 'uppercase', fontStyle: 'normal' }}>
              ─ Team Radio · Race Engineer
            </div>
            {score === total ? (
              <>
                <p style={{ margin: '0 0 2px' }}>„Guys… guys… is this Bingo confirmed?"</p>
                <p style={{ margin: 0 }}>„Copy. <span style={{ color: G.green, fontStyle: 'normal' }}>Bingo confirmed.</span> Box, box for celebration!"</p>
              </>
            ) : score >= total * 0.8 ? (
              <p style={{ margin: 0 }}>„Good session. <span style={{ color: G.amber, fontStyle: 'normal' }}>Almost there.</span> We&apos;ll debrief and come back stronger."</p>
            ) : (
              <>
                <p style={{ margin: '0 0 2px' }}>„We had Bingo?"</p>
                <p style={{ margin: 0 }}>„<span style={{ color: G.red, fontStyle: 'normal' }}>Negative.</span> Wrong strategy. Box, we need to talk."</p>
              </>
            )}
            <audio autoPlay>
              <source src={score === total ? '/audio/bingo-confirmed.mp3' : '/audio/fail-radio.mp3'} type="audio/mpeg" />
            </audio>
          </div>

          {/* Category breakdown — grouped, original logic fully preserved */}
          <div style={{ border: `1px solid ${G.bolt}`, overflow: 'hidden', marginBottom: 28 }}>
            {groups.map((g, gi) => (
              <div key={gi}>
                {/* Group header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '5px 14px',
                  background: `rgba(${g.accent === G.green ? '0,214,143' : g.accent === G.red ? '232,0,45' : '90,90,122'},0.07)`,
                  borderBottom: `1px solid ${G.bolt}`,
                  borderTop: gi > 0 ? `1px solid ${G.bolt}` : 'none',
                }}>
                  {g.icon}
                  <span style={{ fontFamily: FM, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '0.24em', color: `${g.accent}cc`, textTransform: 'uppercase' }}>
                    {g.label}
                  </span>
                </div>
                {g.list.map((cat, i) => {
                  const drv    = assigned.get(cat.id);
                  const isC    = correct.has(cat.id);
                  const isW    = wrong.has(cat.id);
                  const accent = isC ? G.green : isW ? G.red : G.dim;
                  return (
                    <div key={cat.id} style={{
                      display: 'grid', gridTemplateColumns: '20px 36px 1fr auto',
                      gap: '0 10px', alignItems: 'center',
                      padding: '8px 14px',
                      borderBottom: i < g.list.length - 1 ? `1px solid rgba(58,58,82,0.22)` : 'none',
                      background: isC ? `rgba(0,214,143,0.04)` : isW ? `rgba(232,0,45,0.04)` : 'transparent',
                    }}>
                      {/* Status icon */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {isC ? <CheckCircle2 size={13} style={{ color: G.green }} />
                             : isW ? <XCircle size={13} style={{ color: G.red }} />
                             : <MinusCircle size={13} style={{ color: G.dim }} />}
                      </div>
                      {/* Driver thumb */}
                      <div style={{ width: 36, height: 36, position: 'relative', overflow: 'hidden', border: `1px solid ${accent}50`, flexShrink: 0, borderRadius: 2 }}>
                        {drv
                          ? <Image src={`/drivers/${drv.id}.jpg`} alt={drv.name} width={36} height={36} style={{ objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: 36, height: 36, background: G.bolt }} />}
                      </div>
                      {/* Category text + verdict */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: FM, fontWeight: 700, fontSize: '0.96rem',
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                          color: isC ? G.green : isW ? '#ff9080' : G.chrome,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{cat.text}</div>
                        <div style={{ fontFamily: FM, fontSize: '0.65rem', letterSpacing: '0.18em', color: `${accent}70`, marginTop: 1, textTransform: 'uppercase' }}>
                          {isC ? 'Correct' : isW ? 'Wrong' : 'Unselected'}
                        </div>
                      </div>
                      {/* Driver name */}
                      <div style={{
                        fontFamily: FM, fontWeight: 600, fontSize: '0.96rem',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        color: drv ? G.silver : G.dim,
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onRestart}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                fontFamily: FM, fontWeight: 900, fontSize: '0.9rem',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                background: G.red, color: G.white, border: 'none',
                padding: '14px 56px',
                clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
                cursor: 'pointer',
                boxShadow: `0 0 24px rgba(232,0,45,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`,
                transition: 'box-shadow 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 48px rgba(232,0,45,0.65), inset 0 1px 0 rgba(255,255,255,0.14)`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 24px rgba(232,0,45,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`;  e.currentTarget.style.transform = ''; }}
            >
              <RotateCcw size={14} /> Play Again
            </button>
            {pct < 100 && (
              <p style={{ fontFamily: FE, fontStyle: 'italic', fontWeight: 300, fontSize: '0.94rem', color: G.chrome, margin: 0, textAlign: 'center' }}>
                Categories change every game — you can do better.
              </p>
            )}
            {pct === 100 && (
              <p style={{ fontFamily: FE, fontStyle: 'italic', fontWeight: 300, fontSize: '0.94rem', color: `${G.green}90`, margin: 0 }}>
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
export default function BingoGame({ onDone }: { onDone?: (score: number, totalTime: number, bestStreak: number) => void } = {}) {
  const [gs, setGs] = useState<GS | null>(null);
  useEffect(() => { setGs(buildGame()); }, []);

  // ── Timer countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!gs || gs.done || gs.idx >= gs.drivers.length) return;
    if (gs.time <= 0) {
      setGs(prev => {
        if (!prev) return prev;
        const next = prev.idx + 1;
        return { ...prev, idx: next, time: 15, toast: null, done: next >= prev.drivers.length };
      });
      return;
    }
    const id = setTimeout(() => setGs(prev => prev ? { ...prev, time: prev.time - 1 } : prev), 1000);
    return () => clearTimeout(id);
  }, [gs?.time, gs?.done, gs?.idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // (toast removed)

  // ── Total game timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!gs || gs.done) return;
    const id = setInterval(() => setGs(prev => prev && !prev.done ? { ...prev, totalTime: prev.totalTime + 1 } : prev), 1000);
    return () => clearInterval(id);
  }, [gs?.done]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    setGs(prev => {
      if (!prev || prev.done) return prev;
      const next = prev.idx + 1;
      return { ...prev, idx: next, time: 15, streak: 0, toast: null, done: next >= prev.drivers.length };
    });
  }, []);

  const handleAssign = useCallback((catId: string) => {
    setGs(prev => {
      if (!prev || prev.done) return prev;
      if (prev.correct.has(catId) || prev.wrong.has(catId)) return prev;
      const driver   = prev.drivers[prev.idx];
      const category = prev.categories.find(c => c.id === catId);
      if (!driver || !category) return prev;

      const hit         = category.matches(driver);
      const newCorrect  = hit ? new Set([...prev.correct, catId]) : prev.correct;
      const newWrong    = hit ? prev.wrong : new Set([...prev.wrong, catId]);
      const newAssigned = new Map(prev.assigned).set(catId, driver);
      const streak      = hit ? prev.streak + 1 : 0;
      const best        = Math.max(prev.best, streak);
      const answered    = newCorrect.size + newWrong.size;
      const allDone     = answered >= prev.categories.length;
      const nextIdx     = allDone ? prev.idx : prev.idx + 1;
      const done        = allDone || nextIdx >= prev.drivers.length;

      return {
        ...prev,
        correct: newCorrect, wrong: newWrong, assigned: newAssigned,
        streak, best,
        idx: nextIdx, time: 15, done,
      };
    });
  }, []);

  const handleRestart = useCallback(() => setGs(buildGame()), []);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!gs) return <Skeleton />;
  if (gs.done) return <Results gs={gs} onRestart={handleRestart} onDone={onDone} />;

  const driver    = gs.drivers[gs.idx];
  const answered  = gs.correct.size + gs.wrong.size;
  const remaining = gs.drivers.length - gs.idx; // drivers still to be shown
  const tc        = gs.time <= 3;  // timer critical

  return (
    <div style={{ minHeight: '100vh', background: G.void, padding: '20px 18px 18px', position: 'relative' }}>
      <StreakFlash streak={gs.streak} />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 40% at 50% 100%, rgba(232,0,45,0.04) 0%, transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1140, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: 10, gap: 10 }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${G.goldDim} 30%, ${G.goldMid} 60%, transparent)` }} />
            <div style={{ ...PANEL, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <span style={{ fontFamily: FD, fontSize: '1.3rem', lineHeight: 1, color: G.white, position: 'relative', zIndex: 1, padding: '0 0.12em' }}>F1</span>
                <div style={{ position: 'absolute', inset: '2px 0', background: G.red, clipPath: 'polygon(8% 0%,100% 0%,92% 100%,0% 100%)', zIndex: 0, boxShadow: `0 0 14px rgba(232,0,45,0.55)` }} />
              </div>
              <h1 style={{ fontFamily: FD, fontSize: '2.2rem', letterSpacing: '0.12em', color: G.ivory, margin: 0 }}>
                BINGO
              </h1>
              {/* Live total timer */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: G.abyss, border: `1px solid ${G.bolt}` }}>
                <Clock size={11} style={{ color: G.goldDim }} />
                <span style={{ fontFamily: FM, fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.12em', color: G.goldMid }}>
                  {formatTime(gs.totalTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Answered */}
            <div style={{ ...PANEL, padding: '8px 16px', position: 'relative' }}>
              <Rivets />
              <div style={{ fontFamily: FM, fontSize: '0.62rem', letterSpacing: '0.22em', color: G.goldDim, textTransform: 'uppercase', marginBottom: 1 }}>Answered</div>
              <div style={{ fontFamily: FD, fontSize: '2rem', lineHeight: 1, letterSpacing: '0.06em' }}>
                <span style={{ color: G.ivory }}>{answered}</span>
                <span style={{ color: G.bolt, fontSize: '1.3rem' }}>/{gs.categories.length}</span>
              </div>
            </div>
            {/* Remaining */}
            <div style={{ ...PANEL, padding: '8px 16px', position: 'relative' }}>
              <Rivets />
              <div style={{ fontFamily: FM, fontSize: '0.62rem', letterSpacing: '0.22em', color: G.goldDim, textTransform: 'uppercase', marginBottom: 1 }}>Remaining</div>
              <div style={{ fontFamily: FD, fontSize: '2rem', lineHeight: 1, letterSpacing: '0.06em', color: remaining <= 5 ? G.amber : G.silver }}>
                {remaining}
              </div>
            </div>
            {/* Streak */}
            {gs.streak >= 2 && (
              <div style={{ ...PANEL, padding: '8px 16px', position: 'relative', borderColor: `${G.goldDim}55` }}>
                <Rivets />
                <div style={{ fontFamily: FM, fontSize: '0.62rem', letterSpacing: '0.22em', color: G.goldMid, textTransform: 'uppercase', marginBottom: 1 }}>Streak</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FD, fontSize: '2rem', lineHeight: 1, color: G.goldLight }}>
                  {gs.streak}<Flame size={15} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* (toast removed — no answer feedback during game) */}

        {/* ── DRIVER CARD ─────────────────────────────────────────────────── */}
        {driver && (
          <div style={{
            ...PANEL, marginBottom: 8, position: 'relative', overflow: 'hidden',
            display: 'flex',
            borderTop: `1px solid ${G.goldDim}`,
          }}>
            <Rivets />

            {/* Driver photo */}
            <div style={{ position: 'relative', width: 158, height: 158, flexShrink: 0 }}>
              <Image
                src={`/drivers/${driver.id}.jpg`}
                alt={driver.name}
                fill
                style={{ objectFit: 'cover', borderRight: `1px solid ${G.bolt}` }}
                priority
                sizes="158px"
              />
              {/* CRT scanlines */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.05) 0px,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 3px)',
              }} />
              {/* Edge fade into card */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `linear-gradient(to right, transparent 65%, ${G.gunmetal})`,
              }} />
            </div>

            {/* Driver info */}
            <div style={{ flex: 1, padding: '13px 18px 11px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* "Driver Identified" pill — using Pill component */}
                <Pill
                  bg={`rgba(201,168,76,0.1)`}
                  fg={G.goldMid}
                  style={{
                    marginBottom: 8,
                    border: `1px solid ${G.goldDim}`,
                    boxShadow: `0 0 12px rgba(201,168,76,0.15)`,
                  }}
                >
                  Driver Identified
                </Pill>
                <h2 style={{ fontFamily: FD, fontSize: '2.9rem', letterSpacing: '0.02em', color: G.ivory, margin: 0, lineHeight: 1 }}>
                  {driver.name}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={handleSkip}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 14px',
                    fontFamily: FM, fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                    background: G.iron, border: `1px solid ${G.bolt}`, color: G.chrome,
                    cursor: 'pointer',
                    clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = G.ivory; e.currentTarget.style.borderColor = G.dim; e.currentTarget.style.background = G.steel; }}
                  onMouseLeave={e => { e.currentTarget.style.color = G.chrome; e.currentTarget.style.borderColor = G.bolt; e.currentTarget.style.background = G.iron; }}
                >
                  <SkipForward size={10} /> SKIP
                </button>
                <span style={{ fontFamily: FE, fontStyle: 'italic', fontWeight: 300, fontSize: '0.9rem', letterSpacing: '0.02em', color: G.dim }}>
                  Select a matching category
                </span>
              </div>
            </div>

            {/* Timer block — circular ring */}
            <div style={{
              width: 96, flexShrink: 0,
              background: tc
                ? `repeating-linear-gradient(-45deg, rgba(232,0,45,0.12) 0px, rgba(232,0,45,0.12) 8px, ${G.abyss} 8px, ${G.abyss} 16px)`
                : G.abyss,
              borderLeft: `1px solid ${G.bolt}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.5s',
            }}>
              <TimerRing t={gs.time} />
            </div>

            {/* Timer bar at bottom of card */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <TimerBar t={gs.time} />
            </div>
          </div>
        )}

        {/* Overall progress bar (gold) */}
        <div style={{ height: 2, background: G.bolt, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(answered / gs.categories.length) * 100}%`,
            background: `linear-gradient(90deg, ${G.goldDim}, ${G.goldMid})`,
            boxShadow: `0 0 8px rgba(201,168,76,0.5)`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* ── CATEGORY GRID ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
          {gs.categories.map(cat => {
            const done = gs.correct.has(cat.id) || gs.wrong.has(cat.id);
            const accent = catAccentColor(cat.text);
            const icon   = catIcon(cat.text);
            const drv    = gs.assigned.get(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => !done && handleAssign(cat.id)}
                disabled={done}
                style={{
                  position: 'relative', aspectRatio: '1/1', padding: 0,
                  border: `1px solid ${done ? G.bolt + '30' : G.bolt}`,
                  borderTop: `2px solid ${done ? `${G.goldDim}55` : `${accent}45`}`,
                  background: done
                    ? `linear-gradient(145deg, ${G.abyss}, ${G.jet})`
                    : `linear-gradient(145deg, ${G.gunmetal}, ${G.jet})`,
                  overflow: 'hidden',
                  cursor: done ? 'default' : 'pointer',
                  transition: 'transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.14s',
                }}
                onMouseEnter={e => {
                  if (!done) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px) scale(1.04)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.65), 0 0 0 1px ${accent}35`;
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = '';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                }}
              >
                {/* Subtle grid texture */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
                  backgroundImage: `repeating-linear-gradient(0deg,${G.ivory} 0,${G.ivory} 1px,transparent 1px,transparent 22px),
                                    repeating-linear-gradient(90deg,${G.ivory} 0,${G.ivory} 1px,transparent 1px,transparent 22px)`,
                }} />

                {/* Per-category colour glow — only on unanswered */}
                {!done && (
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `radial-gradient(ellipse at 50% -10%, ${accent}18, transparent 60%)`,
                  }} />
                )}

                {/* ── ASSIGNED: show driver photo + name ── */}
                {done && drv ? (
                  <>
                    {/* Full-tile driver photo */}
                    <Image
                      src={`/drivers/${drv.id}.jpg`}
                      alt={drv.name}
                      fill
                      sizes="20vw"
                      style={{ objectFit: 'cover', objectPosition: 'top center', opacity: 0.5 }}
                    />
                    {/* Bottom gradient for name legibility */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `linear-gradient(to top, rgba(5,5,7,0.95) 30%, rgba(5,5,7,0.1) 100%)`,
                    }} />
                    {/* Thin gold top bar */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                      background: `linear-gradient(90deg, transparent, ${G.goldDim} 30%, ${G.goldMid} 50%, ${G.goldDim} 70%, transparent)`,
                    }} />
                    {/* Driver name */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '0 5px 5px',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontFamily: FD, fontSize: '0.78rem', letterSpacing: '0.06em',
                        textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.1,
                        color: G.ivory,
                        textShadow: '0 1px 8px rgba(0,0,0,1), 0 0 16px rgba(0,0,0,0.9)',
                      }}>
                        {drv.name}
                      </span>
                    </div>
                  </>
                ) : (
                  /* ── UNANSWERED: category display ── */
                  <div style={{
                    position: 'relative', zIndex: 2,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', padding: '10px 7px', gap: 5,
                  }}>
                    <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{icon}</span>
                    <span style={{
                      fontFamily: FM, fontWeight: 800, fontSize: '0.88rem',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      textAlign: 'center', lineHeight: 1.2,
                      color: G.silver,
                      textShadow: '0 1px 8px rgba(0,0,0,0.95)',
                    }}>
                      {cat.text}
                    </span>
                  </div>
                )}

                {/* Bottom accent strip */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: done
                    ? `linear-gradient(90deg, transparent, ${G.goldDim}45, transparent)`
                    : `linear-gradient(90deg, transparent, ${accent}40, transparent)`,
                }} />
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}