export type Driver = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  abbreviation?: string;
  permanentNumber?: string | null;
  gender?: string;
  country: string;
  flag?: string;
  teams: string[];
  championships: number;
  wins: number;
  poles: number;
  wetWins?: boolean;
  notable?: string[];

  // Date & place fields
  dateOfBirth?: string;
  dateOfDeath?: string | null;
  placeOfBirth?: string;
  countryOfBirthCountryId?: string;
  nationalityCountryId?: string;
  secondNationalityCountryId?: string | null;

  // Career stats
  bestChampionshipPosition?: number | null;
  bestStartingGridPosition?: number | null;
  bestRaceResult?: number | null;
  bestSprintRaceResult?: number | null;
  totalChampionshipWins?: number;
  totalRaceEntries?: number;
  totalRaceStarts?: number;
  totalRaceWins?: number;
  totalRaceLaps?: number;
  totalPodiums?: number;
  totalPoints?: number;
  totalChampionshipPoints?: number;
  totalPolePositions?: number;
  totalFastestLaps?: number;
  totalSprintRaceStarts?: number;
  totalSprintRaceWins?: number;
  totalDriverOfTheDay?: number;
  totalGrandSlams?: number;
};

export type Category = {
  id: string;
  text: string;
  matches: (driver: Driver) => boolean;
};