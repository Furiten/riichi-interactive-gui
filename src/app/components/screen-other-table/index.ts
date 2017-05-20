/*
 * Tyr - Allows online game recording in japanese (riichi) mahjong sessions
 * Copyright (C) 2016 Oleg Klimenko aka ctizen <me@ctizen.net>
 *
 * This file is part of Tyr.
 *
 * Tyr is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Tyr is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Tyr.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, Input } from '@angular/core';
import { AppState } from '../../primitives/appstate';
import { YakuId, yakuMap } from '../../primitives/yaku';
import { Player } from '../../interfaces/common';
import { RRoundPaymentsInfo } from '../../interfaces/remote';

@Component({
  selector: 'screen-other-table',
  templateUrl: 'template.html',
  styleUrls: ['style.css']
})
export class OtherTableScreen {
  @Input() state: AppState;
  @Input() players: Player[];
  @Input() lastRound: RRoundPaymentsInfo;
  /**
   * Flag to prevent blinking on manual updates when all data was already loaded
   */
  private _dataUpdated = false;
  private _updateInterval: NodeJS.Timer;

  self: Player;
  shimocha: Player;
  toimen: Player;
  kamicha: Player;

  seatSelf: string;
  seatShimocha: string;
  seatToimen: string;
  seatKamicha: string;

  _diffedBy: string = null;
  _currentPlayer: number = 0;

  get currentGameHash() {
    return this.state.getCurrentOtherTableHash();
  }

  get currentTable() {
    return this.state.getCurrentOtherTable().state;
  }

  get _loading() {
    return !this._dataUpdated && this.state.isLoading('otherTable');
  }

  getScore(who) {
    let score = this[who].score;
    if (!this._diffedBy) {
      return score;
    }

    if (this._diffedBy && this._diffedBy !== who) {
      score -= this[this._diffedBy].score;
    }
    return (score > 0 && this._diffedBy !== who) ? '+' + score : score;
  }

  getChomboCount(who) {
    return Math.abs(
      (this[who].penalties || 0) /
      this.state.getGameConfig('chomboPenalty')
    ) || '';
  }

  reloadOverview() {
    this.state.updateOtherTable(this.currentGameHash);
  }

  viewLastRound() {
    this.state.updateOtherTableLastRound(this.currentGameHash);
  }

  rotateTable(dir: boolean) {
    if (dir) { // counter-clockwise
      this._currentPlayer = (this._currentPlayer + 1) % 4;
    } else { // clockwise
      this._currentPlayer = (this._currentPlayer + 3) % 4;
    }
    this.updatePlayers();
  }

  playerClick(who: string) {
    if (this._diffedBy === who) {
      this._diffedBy = null;
    } else {
      this._diffedBy = who;
    }
  }

  ngOnChanges() {
    this.updatePlayers();
  }

  ngOnInit() {
    this.updatePlayers();
    this._updateInterval = setInterval(() => this._dataUpdated && this.reloadOverview(), 5000);
  }

  ngOnDestroy() {
    clearInterval(this._updateInterval);
  }

  private updatePlayers() {
    if (!this.players || this.players.length !== 4) {
      this._dataUpdated = false;
      return;
    }

    this._dataUpdated = true;

    let players: Player[] = [].concat(this.players);
    let seating = ['東', '南', '西', '北'];
    for (let i = 1; i < this.currentTable.round; i++) {
      seating = [seating.pop()].concat(seating);
    }

    for (let i = 0; i < 4; i++) {
      if (this._currentPlayer === i) {
        break;
      }

      players = players.slice(1).concat(players[0]);
      seating = seating.slice(1).concat(seating[0]);
    }

    this.self = players[0];
    this.shimocha = players[1];
    this.toimen = players[2];
    this.kamicha = players[3];

    this.seatSelf = seating[0];
    this.seatShimocha = seating[1];
    this.seatToimen = seating[2];
    this.seatKamicha = seating[3];
  }

  /// last round related

  getWins(): Array<{ winner: string, loser: string, han: number, fu: number, dora: number, yakuList: string }> {
    switch (this.lastRound.outcome) {
      case 'ron':
      case 'tsumo':
        return [{
          winner: this._getPlayerName(this.lastRound.winner),
          loser: this._getLoserName(),
          yakuList: this._getYakuList(this.lastRound.yaku),
          han: this.lastRound.han,
          fu: this.lastRound.fu,
          dora: this.lastRound.dora
        }];
      case 'multiron':
        let wins = [];
        for (let idx in this.lastRound.winner) {
          wins.push({
            winner: this._getPlayerName(this.lastRound.winner[idx]),
            loser: this._getLoserName(),
            yakuList: this._getYakuList(this.lastRound.yaku[idx]),
            han: this.lastRound.han[idx],
            fu: this.lastRound.fu[idx],
            dora: this.lastRound.dora[idx]
          });
        }
        return wins;
    }
  }

  getOutcomeName() {
    switch (this.lastRound.outcome) {
      case 'ron': return 'Рон';
      case 'tsumo': return 'Цумо';
      case 'draw': return 'Ничья';
      case 'abort': return 'Абортивная ничья';
      case 'chombo': return 'Чомбо';
      case 'multiron': return this.lastRound.winner.length === 2 ? 'Дабл-рон' : 'Трипл-рон';
    }
  }

  getPenalty() {
    if (this.lastRound.outcome !== 'chombo') {
      return;
    }
    return this._getPlayerName(this.lastRound.penaltyFor);
  }

  getTempaiPlayers() {
    if (this.lastRound.outcome !== 'draw') {
      return;
    }

    return Object.keys(this.lastRound.payments.direct)
      .map((i) => parseInt(i.split('<-')[0], 10))
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((i) => this._getPlayerName(i))
      .join(', ');
  }

  getNotenPlayers() {
    if (this.lastRound.outcome !== 'draw') {
      return;
    }
    return Object.keys(this.lastRound.payments.direct)
      .map((i) => parseInt(i.split('<-')[1], 10))
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((i) => this._getPlayerName(i))
      .join(', ');
  }

  getRiichiPlayers() {
    return this.lastRound.riichiIds.map(
      (p) => this._getPlayerName(parseInt(p, 10))
    ).join(', ');
  }

  private _getYakuList(str: string) {
    const yakuIds: YakuId[] = str.split(',').map((y) => parseInt(y, 10));
    const yakuNames: string[] = yakuIds.map((y) => yakuMap[y].name.toLowerCase());
    return yakuNames.join(', ');
  }

  private _getPlayerName(player) {
    return this.players.reduce((acc, curr) => {
      if (acc) {
        return acc;
      }

      if (curr.id === player) {
        return curr.displayName;
      }
    }, null);
  }

  private _getLoserName() {
    for (let i in this.lastRound.payments.direct) {
      return this._getPlayerName(parseInt(i.split('<-')[1], 10));
    }
  }
}


