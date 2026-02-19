export type Driver = {
  id: string;
  name: string;
  country: string;
  flag?: string;           // ex: "🇳🇱"
  teams: string[];
  championships: number;
  wins: number;
  poles: number;
  wetWins?: boolean;
  notable?: string[];      // ex: ["accident cu Verstappen", "debut cu podium"]
};

export type Category = {
  id: string;
  text: string;
  matches: (driver: Driver) => boolean;   // funcția de verificare
};