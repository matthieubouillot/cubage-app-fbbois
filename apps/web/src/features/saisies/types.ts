export type SaisieRow = {
  id: string;
  date: string;
  numero: number;
  longueur: number;
  diametre: number;
  volLtV1?: number | null;
  volBetweenV1V2?: number | null;
  volGeV2?: number | null;
  volumeCalc: number;
  annotation?: string | null;
  user?: { id: string; firstName: string; lastName: string };
  debardeur?: { id: string; firstName: string; lastName: string } | null;
};

export type SaisieStats = {
  columns: {
    ltV1: { sum: number; count: number; avg: number };
    between: { sum: number; count: number; avg: number };
    geV2: { sum: number; count: number; avg: number };
  };
  total: { sum: number; count: number; avg: number };
};


