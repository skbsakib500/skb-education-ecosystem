export interface Subject {
  id: string;
  name: string;
  bn: string;
  chapters: number;
  completed: number;
  color: string;
  accent: string;
}

export interface RoutineItem {
  time: string;
  subject: string;
  bn: string;
  type: string;
  done: boolean;
}

export interface Countdown {
  d: number;
  h: number;
  m: number;
  s: number;
}
