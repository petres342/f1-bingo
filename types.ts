export type Driver = {
  id: string;
  name: string;
  country: string;
  flag?: string;
  teams: string[];
  championships: number;
  wins: number;
  poles: number;
  wetWins?: boolean;
  notable?: string[];

  // Fields used in categories.ts
  nationalityCountryId?: string;
  countryOfBirthCountryId?: string;
  dateOfBirth?: string;
  totalChampionshipWins?: number;
  totalRaceWins?: number;
  totalPolePositions?: number;
  totalPodiums?: number;
  totalRaceStarts?: number;
  totalPoints?: number;
  totalFastestLaps?: number;
  totalGrandSlams?: number;
  totalDriverOfTheDay?: number;
  totalSprintRaceWins?: number;
  totalRaceLaps?: number;
  bestChampionshipPosition?: number;
};

export type Category = {
  id: string;
  text: string;
  matches: (driver: Driver) => boolean;
};