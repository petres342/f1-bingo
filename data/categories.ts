import { Category, Driver } from '@/types';
import { allDrivers } from './drivers';

// ------------------------------------------------------------------------
// 1. Funcții ajutătoare pentru percentile și statistici
// ------------------------------------------------------------------------

// Calculează percentila dintr-un array de valori numerice
function getPercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * (sorted.length - 1));
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

// Extrage naționalități unice (și cele mai comune)
function getCommonNationalities(limit: number = 20): string[] {
  const countMap = new Map<string, number>();
  allDrivers.forEach(d => {
    const nat = d.nationalityCountryId;
    if (nat) countMap.set(nat, (countMap.get(nat) || 0) + 1);
  });
  return Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])  // sortează după frecvență
    .map(entry => entry[0])
    .slice(0, limit);
}

// Pre-calculează statistici pentru toate câmpurile numerice (o dată la încărcare)
const precomputedStats = (() => {
  const wins = allDrivers.map(d => d.totalRaceWins || 0);
  const poles = allDrivers.map(d => d.totalPolePositions || 0);
  const podiums = allDrivers.map(d => d.totalPodiums || 0);
  const starts = allDrivers.map(d => d.totalRaceStarts || 0);
  const points = allDrivers.map(d => d.totalPoints || 0);
  const fastestLaps = allDrivers.map(d => d.totalFastestLaps || 0);
  const championships = allDrivers.map(d => d.totalChampionshipWins || 0);
  const grandSlams = allDrivers.map(d => d.totalGrandSlams || 0);

  return {
    wins: { p50: getPercentile(wins, 50), p75: getPercentile(wins, 75), p90: getPercentile(wins, 90) },
    poles: { p50: getPercentile(poles, 50), p75: getPercentile(poles, 75), p90: getPercentile(poles, 90) },
    podiums: { p50: getPercentile(podiums, 50), p75: getPercentile(podiums, 75), p90: getPercentile(podiums, 90) },
    starts: { p50: getPercentile(starts, 50), p75: getPercentile(starts, 75), p90: getPercentile(starts, 90) },
    points: { p50: getPercentile(points, 50), p75: getPercentile(points, 75), p90: getPercentile(points, 90) },
    fastestLaps: { p50: getPercentile(fastestLaps, 50), p75: getPercentile(fastestLaps, 75), p90: getPercentile(fastestLaps, 90) },
    championships: { p50: getPercentile(championships, 50), p75: getPercentile(championships, 75), p90: getPercentile(championships, 90) },
    grandSlams: { p50: getPercentile(grandSlams, 50), p75: getPercentile(grandSlams, 75), p90: getPercentile(grandSlams, 90) },
  };
})();

// ------------------------------------------------------------------------
// 2. Template-uri de categorii (mix de numerice și calitative)
// ------------------------------------------------------------------------

const categoryTemplates = [
  {
    baseId: "championships",
    text: (val: number) => `${val}+ championship titles`,
    matches: (d: any, val: number) => (d.totalChampionshipWins || 0) >= val,
    getThreshold: () => [precomputedStats.championships.p50, precomputedStats.championships.p75, precomputedStats.championships.p90][Math.floor(Math.random() * 3)] || 1
  },
  {
    baseId: "race-wins",
    text: (val: number) => `${val}+ race wins`,
    matches: (d: any, val: number) => (d.totalRaceWins || 0) >= val,
    getThreshold: () => [precomputedStats.wins.p50, precomputedStats.wins.p75, precomputedStats.wins.p90][Math.floor(Math.random() * 3)] || 1
  },
  {
    baseId: "pole-positions",
    text: (val: number) => `${val}+ pole positions`,
    matches: (d: any, val: number) => (d.totalPolePositions || 0) >= val,
    getThreshold: () => [precomputedStats.poles.p50, precomputedStats.poles.p75, precomputedStats.poles.p90][Math.floor(Math.random() * 3)] || 1
  },
  {
    baseId: "podiums",
    text: (val: number) => `${val}+ podiums`,
    matches: (d: any, val: number) => (d.totalPodiums || 0) >= val,
    getThreshold: () => [precomputedStats.podiums.p50, precomputedStats.podiums.p75, precomputedStats.podiums.p90][Math.floor(Math.random() * 3)] || 1
  },
  {
    baseId: "starts",
    text: (val: number) => `${val}+ race starts`,
    matches: (d: any, val: number) => (d.totalRaceStarts || 0) >= val,
    getThreshold: () => [precomputedStats.starts.p50, precomputedStats.starts.p75, precomputedStats.starts.p90][Math.floor(Math.random() * 3)] || 50
  },
  {
    baseId: "points",
    text: (val: number) => `${val}+ points scored`,
    matches: (d: any, val: number) => (d.totalPoints || 0) >= val,
    getThreshold: () => [precomputedStats.points.p50, precomputedStats.points.p75, precomputedStats.points.p90][Math.floor(Math.random() * 3)] || 100
  },
  {
    baseId: "fastest-laps",
    text: (val: number) => `${val}+ fastest laps`,
    matches: (d: any, val: number) => (d.totalFastestLaps || 0) >= val,
    getThreshold: () => [precomputedStats.fastestLaps.p50, precomputedStats.fastestLaps.p75, precomputedStats.fastestLaps.p90][Math.floor(Math.random() * 3)] || 1
  },
  {
    baseId: "grand-slams",
    text: (val: number) => `${val}+ Grand Slams`,
    matches: (d: any, val: number) => (d.totalGrandSlams || 0) >= val,
    getThreshold: () => [precomputedStats.grandSlams.p50, precomputedStats.grandSlams.p75, precomputedStats.grandSlams.p90][Math.floor(Math.random() * 3)] || 1
  },
  {
    baseId: "nationality",
    text: (nat: string) => `Driver from ${nat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    matches: (d: any, nat: string) => d.nationalityCountryId === nat,
    getValue: () => {
      const commons = getCommonNationalities(20);
      return commons[Math.floor(Math.random() * commons.length)];
    }
  },
  {
    baseId: "birth-decade",
    text: (decade: number) => `Born in the ${decade}s`,
    matches: (d: any, decade: number) => {
      const year = new Date(d.dateOfBirth || '1900-01-01').getFullYear();
      return Math.floor(year / 10) * 10 === decade;
    },
    getValue: () => {
      const decades = allDrivers.map(d => {
        const year = new Date(d.dateOfBirth || '1900-01-01').getFullYear();
        return Math.floor(year / 10) * 10;
      }).filter(Boolean);
      const unique = [...new Set(decades)];
      return unique[Math.floor(Math.random() * unique.length)] || 1980;
    }
  },
  // ── 5 categorii noi ──────────────────────────────────────────────────────
  {
    baseId: "driver-of-the-day",
    text: (val: number) => `${val}+ Driver of the Day awards`,
    matches: (d: any, val: number) => (d.totalDriverOfTheDay || 0) >= val,
    getThreshold: () => {
      const vals = allDrivers.map(d => d.totalDriverOfTheDay || 0);
      const p = [getPercentile(vals, 50), getPercentile(vals, 75), getPercentile(vals, 90)];
      return p[Math.floor(Math.random() * 3)] || 1;
    }
  },
  {
    baseId: "sprint-wins",
    text: (val: number) => `${val}+ sprint wins`,
    matches: (d: any, val: number) => (d.totalSprintRaceWins || 0) >= val,
    getThreshold: () => {
      const vals = allDrivers.map(d => d.totalSprintRaceWins || 0).filter(v => v > 0);
      if (vals.length === 0) return 1;
      const p = [getPercentile(vals, 50), getPercentile(vals, 75), getPercentile(vals, 90)];
      return p[Math.floor(Math.random() * 3)] || 1;
    }
  },
  {
    baseId: "best-championship",
    text: (val: number) => `Finished top ${val} in championship`,
    matches: (d: any, val: number) => (d.bestChampionshipPosition || 999) <= val,
    getThreshold: () => {
      return [1, 3, 5, 10][Math.floor(Math.random() * 4)];
    }
  },
  {
    baseId: "total-laps",
    text: (val: number) => `${val.toLocaleString()}+ laps completed`,
    matches: (d: any, val: number) => (d.totalRaceLaps || 0) >= val,
    getThreshold: () => {
      const vals = allDrivers.map(d => d.totalRaceLaps || 0);
      const p = [getPercentile(vals, 50), getPercentile(vals, 75), getPercentile(vals, 90)];
      const raw = p[Math.floor(Math.random() * 3)] || 1000;
      return Math.round(raw / 500) * 500;
    }
  },
  {
    baseId: "birth-country",
    text: (country: string) => `Born in ${country.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    matches: (d: any, country: string) => d.countryOfBirthCountryId === country,
    getValue: () => {
      const countMap = new Map<string, number>();
      allDrivers.forEach(d => {
        const c = d.countryOfBirthCountryId;
        if (c) countMap.set(c, (countMap.get(c) || 0) + 1);
      });
      const common = Array.from(countMap.entries())
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(e => e[0])
        .slice(0, 15);
      return common[Math.floor(Math.random() * common.length)] || 'united-kingdom';
    }
  },
];

// ------------------------------------------------------------------------
// 3. Generatorul sofisticat (10 categorii random la fiecare joc)
// ------------------------------------------------------------------------

export const generateDailyCategories = (): Category[] => {
  const selected: Category[] = [];

  // Amestecăm template-urile pentru varietate
  const shuffledTemplates = [...categoryTemplates].sort(() => Math.random() - 0.5);

  for (const template of shuffledTemplates) {
    if (selected.length >= 15) break;

    let param: number | string;
    if (template.getThreshold) {
      param = Math.ceil(template.getThreshold());  // prag bazat pe percentile
    } else if (template.getValue) {
      param = template.getValue();
    } else continue;

    if (!param) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = template as any;
    selected.push({
      id: `${template.baseId}-${param}`,
      text: t.text(param),
      matches: (d: Driver) => t.matches(d, param)
    });
  }

  // Dacă nu am ajuns la 15, reumplem cu naționalități extra
  while (selected.length < 15) {
    const natTemplate = categoryTemplates.find(t => t.baseId === "nationality");
    if (!natTemplate) break;
    const nat = natTemplate.getValue!() as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nt = natTemplate as any;
    selected.push({
      id: `nat-${nat}`,
      text: nt.text(nat),
      matches: (d: Driver) => nt.matches(d, nat)
    });
  }

  // Amestecăm final cartela
  return selected.sort(() => Math.random() - 0.5);
};