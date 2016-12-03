import { Outcome as OutcomeType } from './common';
import { YakuId } from '../primitives/yaku';

export interface Outcome {
  selectedOutcome: OutcomeType;
  roundIndex: number;
}

export interface WinProps {
  winner: number;
  han: number;
  fu: number;
  possibleFu: number[];
  yaku: YakuId[];
  riichiBets: number[]; // ids of players
  dora: number;
}

export interface AppOutcomeRon extends Outcome, WinProps {
  selectedOutcome: 'ron';
  loser: number;
}

export interface AppOutcomeMultiRon extends Outcome {
  selectedOutcome: 'multiron';
  loser: number;
  multiRon: number;
  wins: WinProps[];
}

export interface AppOutcomeTsumo extends Outcome, WinProps {
  selectedOutcome: 'tsumo';
}

export interface AppOutcomeAbort extends Outcome {
  selectedOutcome: 'abort';
  riichiBets: number[]; // ids of players
}

export interface AppOutcomeDraw extends Outcome {
  selectedOutcome: 'draw';
  riichiBets: number[]; // ids of players
  tempai: number[]; // ids of players
}

export interface AppOutcomeChombo extends Outcome {
  selectedOutcome: 'chombo';
  loser: number;
}

export type AppOutcome
  = AppOutcomeRon
  | AppOutcomeTsumo
  | AppOutcomeMultiRon
  | AppOutcomeDraw
  | AppOutcomeAbort
  | AppOutcomeChombo
  ;


