import {
  Outcome,
  AppOutcome,
  AppOutcomeRon,
  AppOutcomeTsumo,
  AppOutcomeDraw,
  AppOutcomeAbort,
  AppOutcomeChombo,
  AppOutcomeMultiRon
} from '../interfaces/app';
import { ApplicationRef } from '@angular/core';
import {
  Outcome as OutcomeType,
  Yaku,
  Player
} from '../interfaces/common';

type AppScreen = 'overview' | 'outcomeSelect' | 'playersSelect' | 'yakuSelect' | 'confirmation';

export class AppState {
  private _currentScreen: AppScreen = 'overview';

  private _currentOutcome: AppOutcome = null;
  private _currentRound: number = 1;
  private _players: [Player, Player, Player, Player]; // e-s-w-n
  private _mapIdToPlayer: { [key: number]: Player };
  private _riichiOnTable: number = 0;
  private _honba: number = 0;
  private _timeRemaining: string = '00:00';

  private _currentPlayerId: number = 1;

  constructor(public appRef: ApplicationRef) {
    this._players = [ // TODO
      { id: 1, alias: '', displayName: 'User1', score: 23000 },
      { id: 2, alias: '', displayName: 'User2', score: 24000 },
      { id: 3, alias: '', displayName: 'User3', score: 26000 },
      { id: 4, alias: '', displayName: 'User4', score: 27000 }
    ];

    this._mapIdToPlayer = {};
    for (let p of this._players) {
      this._mapIdToPlayer[p.id] = p;
    }
  }

  currentScreen() {
    return this._currentScreen;
  }

  getOutcome() {
    return this._currentOutcome && this._currentOutcome.selectedOutcome;
  }

  toggleWinner(p: Player) {
    switch (this._currentOutcome.selectedOutcome) {
      case 'ron':
      case 'tsumo':
        this._currentOutcome.winner =
          this._currentOutcome.winner === p.id ? null : p.id;
        break;
      case 'multiron':
        // TODO: add win, etc
        break;
      case 'draw':
        const pIdx = this._currentOutcome.tempai.indexOf(p.id);
        if (pIdx === -1) {
          this._currentOutcome.tempai.push(p.id);
        } else {
          this._currentOutcome.tempai.splice(pIdx, 1);
        }
        break;
      default:
        throw new Error('No winners exist on this outcome');
    }
  }

  toggleLoser(p: Player) {
    switch (this._currentOutcome.selectedOutcome) {
      case 'ron':
      case 'multiron':
      case 'chombo':
        this._currentOutcome.loser =
          this._currentOutcome.loser === p.id ? null : p.id;
        break;
      default:
        throw new Error('No losers exist on this outcome');
    }
  }

  toggleRiichi(p: Player) {
    switch (this._currentOutcome.selectedOutcome) {
      case 'ron':
      case 'tsumo':
      case 'abort':
      case 'draw':
        const pIdx = this._currentOutcome.riichiBets.indexOf(p.id);
        if (pIdx === -1) {
          this._currentOutcome.riichiBets.push(p.id);
        } else {
          this._currentOutcome.riichiBets.splice(pIdx, 1);
        }
        break;
      case 'multiron':
        // TODO: how?
        break;
      default:
        throw new Error('No winners exist on this outcome');
    }
  }

  getWinningUsers(): Player[] {
    switch (this._currentOutcome.selectedOutcome) {
      case 'ron':
      case 'tsumo':
        return this._currentOutcome.winner
          ? [this._mapIdToPlayer[this._currentOutcome.winner]]
          : [];
      case 'multiron':
        return this._currentOutcome.wins.map((win) => this._mapIdToPlayer[win.winner]);
      case 'draw':
        return this._currentOutcome.tempai.map((t) => this._mapIdToPlayer[t]);
      default:
        return [];
    }
  }

  getLosingUsers(): Player[] {
    switch (this._currentOutcome.selectedOutcome) {
      case 'ron':
      case 'multiron':
      case 'chombo':
        return this._currentOutcome.loser
          ? [this._mapIdToPlayer[this._currentOutcome.loser]]
          : [];
      default:
        return [];
    }
  }

  getRiichiUsers(): Player[] {
    switch (this._currentOutcome.selectedOutcome) {
      case 'ron':
      case 'tsumo':
      case 'draw':
      case 'abort':
        return this._currentOutcome.riichiBets.map((r) => this._mapIdToPlayer[r]);
      case 'multiron':
        return this._currentOutcome.wins.reduce(
          (acc, win) => acc.concat(
            win.riichiBets.map(
              (r) => this._mapIdToPlayer[r]
            )
          ), []);
      default:
        return [];
    }
  }

  setHan(han) {

  }

  setFu(fu) {

  }

  getHan() { return 0; } // TODO: 
  getFu() { return 30; } // TODO: 
  getPlayers(): Player[] {
    return this._players;
  }
  getRiichi() { // TODO: 
    return 1;
  }
  getHonba() { // TODO: 
    return 0;
  }
  getCurrentRound() {
    return this._currentRound;
  }
  getTimeRemaining() {
    return this._timeRemaining;
  }
  getCurrentPlayerId() {
    return this._currentPlayerId;
  }

  getTournamentTitle() {
    return 'Быстрый сброс-2017';
  }

  nextScreen() { // TODO: повесить на историю для управления хотя бы переходами по экранам
    switch (this._currentScreen) {
      case 'overview':
        this._currentScreen = 'outcomeSelect';
        break;
      case 'outcomeSelect':
        this._currentScreen = 'playersSelect';
        break;
      case 'playersSelect':
        switch (this._currentOutcome.selectedOutcome) {
          case 'ron':
          case 'tsumo':
            this._currentScreen = 'yakuSelect';
            break;
          case 'multiron':
            this._currentScreen = 'yakuSelect'; // TODO this is only first of several yaku-select-screens
            break;
          case 'draw':
          case 'abort':
          case 'chombo':
            this._currentScreen = 'confirmation';
            break;
          default: ;
        }
      default: ;
    }

    // TODO: вроде и без этого работает, убрать если в прод-версии тоже ок
    //    this.appRef.tick(); // force recalc & rerender
  }

  prevScreen() {
    switch (this._currentScreen) {
      case 'outcomeSelect':
        this._currentScreen = 'overview';
        break;
      case 'playersSelect':
        this._currentScreen = 'outcomeSelect';
        break;
      case 'yakuSelect':
        this._currentScreen = 'playersSelect';
        break;
      default: ;
    }
  }

  initBlankOutcome(outcome: OutcomeType) {
    switch (outcome) {
      case 'ron':
        const outcomeRon: AppOutcomeRon = {
          selectedOutcome: 'ron',
          roundIndex: this._currentRound,
          loser: null,
          winner: null,
          han: 0,
          fu: 30,
          yaku: [],
          riichiBets: [],
          dora: 0
        };
        this._currentOutcome = outcomeRon;
        break;
      case 'multiron':
        const outcomeMultiRon: AppOutcomeMultiRon = {
          selectedOutcome: 'multiron',
          roundIndex: this._currentRound,
          loser: null,
          multiRon: 0,
          wins: []
        };
        this._currentOutcome = outcomeMultiRon;
        break;
      case 'tsumo':
        const outcomeTsumo: AppOutcomeTsumo = {
          selectedOutcome: 'tsumo',
          roundIndex: this._currentRound,
          winner: null,
          han: 0,
          fu: 30,
          yaku: [],
          riichiBets: [],
          dora: 0
        };
        this._currentOutcome = outcomeTsumo;
        break;
      case 'draw':
        const outcomeDraw: AppOutcomeDraw = {
          selectedOutcome: 'draw',
          roundIndex: this._currentRound,
          riichiBets: [],
          tempai: []
        };
        this._currentOutcome = outcomeDraw;
        break;
      case 'abort':
        const outcomeAbort: AppOutcomeAbort = {
          selectedOutcome: 'abort',
          roundIndex: this._currentRound,
          riichiBets: []
        };
        this._currentOutcome = outcomeAbort;
        break;
      case 'chombo':
        const outcomeChombo: AppOutcomeChombo = {
          selectedOutcome: 'chombo',
          roundIndex: this._currentRound,
          loser: null
        };
        this._currentOutcome = outcomeChombo;
        break;
    }
  }
}
