import {
  Component,
  ViewChild, ViewChildren,
  QueryList, ElementRef,
  Input
} from '@angular/core';
import { Yaku } from '../../interfaces/common';
import { YakuId } from '../../primitives/yaku';
import { yakuGroups, yakumanGroups, yakuRareGroups } from './yaku-lists';
import { throttle, keys, pickBy } from 'lodash';
import { AppState } from '../../primitives/appstate';

@Component({
  selector: 'screen-yaku-select',
  templateUrl: 'template.html',
  styleUrls: ['style.css']
})
export class YakuSelectScreen {
  @Input() state: AppState;
  yakuList: { anchor: string; groups: Yaku[][] }[];
  disabledYaku: { [key: number]: boolean } = {};
  _viewportHeight: string = null;
  _tabsHeight: string = null;

  constructor() {
    this.yakuList = [
      { anchor: 'simple', groups: yakuGroups },
      { anchor: 'rare', groups: yakuRareGroups },
      { anchor: 'yakuman', groups: yakumanGroups }
    ];

    this._viewportHeight = (window.innerHeight - 60) + 'px'; // 60 is height of navbar;
    this._tabsHeight = parseInt((window.innerWidth * 0.08).toString(), 10) + 'px'; // Should equal to margin-left of buttons & scroller-wrap
  }

  ngOnInit() {
    if (this.state.getOutcome() === 'multiron') {
      this.state.selectMultiRonUser(this.state.getWinningUsers()[0].id);

      // TODO: support multi-screen
      this._enableRequiredYaku();
      this._disableIncompatibleYaku();

    } else {
      if (this.state.getOutcome() === 'tsumo') {
        this.state.addYaku(YakuId.MENZENTSUMO);
      }
      this._enableRequiredYaku();
      this._disableIncompatibleYaku();
    }
  }

  showTabs() {
    return this.state.getOutcome() === 'multiron';
  }

  outcome() {
    switch (this.state.getOutcome()) {
      case 'ron':
      case 'multiron':
        return 'Рон';
      case 'tsumo':
        return 'Цумо';
      case 'draw':
        return 'Ничья';
      case 'abort':
        return 'Пересдача';
      case 'chombo':
        return 'Чомбо';
      default:
        return '';
    }
  }

  yakuSelect(evt) {
    if (this.state.hasYaku(evt.id)) {
      this.state.removeYaku(evt.id);
    } else {
      this.state.addYaku(evt.id);
    }
    this._enableRequiredYaku();
    this._disableIncompatibleYaku();
  }

  _disableIncompatibleYaku() {
    const allowedYaku = this.state.getAllowedYaku();

    this.disabledYaku = {};
    for (let yGroup of this.yakuList) {
      for (let yRow of yGroup.groups) {
        for (let yaku of yRow) {
          if (allowedYaku.indexOf(yaku.id) === -1 && !this.state.hasYaku(yaku.id)) {
            this.disabledYaku[yaku.id] = true;
          }
        }
      }
    }
  }

  _enableRequiredYaku() {
    const requiredYaku = this.state.getRequiredYaku();
    requiredYaku.forEach((y) => this.state.addYaku(y, true));
  }

  isSelected(id: YakuId) {
    return this.state.getSelectedYaku().indexOf(id) !== -1;
  }

  // -------------------------------
  // ---- View & scroll related ----
  // -------------------------------
  @ViewChild('scroller') scroller: ElementRef;
  @ViewChildren('scrlink') links: QueryList<ElementRef>;
  private _simpleLink: HTMLAnchorElement;

  private _rareLink: HTMLAnchorElement;
  private _yakumanLink: HTMLAnchorElement;
  selectedSimple: boolean = true;
  selectedRare: boolean = false;
  selectedYakuman: boolean = false;

  updateAfterScroll() {
    throttle(() => this._updateAfterScroll(), 16)();
  }

  private _makeLinks() {
    if (this._simpleLink) {
      return;
    }

    for (let link of this.links.toArray()) {
      switch (link.nativeElement.name) {
        case 'simple':
          this._simpleLink = link.nativeElement;
          break;
        case 'rare':
          this._rareLink = link.nativeElement;
          break;
        case 'yakuman':
          this._yakumanLink = link.nativeElement;
          break;
      }
    }
  }

  private _updateAfterScroll() {
    this._makeLinks();

    if (this.scroller.nativeElement.scrollTop - this._simpleLink.offsetTop < 500) { // highest edge case
      this.selectedRare = this.selectedYakuman = false;
      this.selectedSimple = true;
    } else if (this._yakumanLink.offsetTop - this.scroller.nativeElement.scrollTop < 150) { // lowest edge case
      this.selectedRare = this.selectedSimple = false;
      this.selectedYakuman = true;
    } else { // middle case
      this.selectedSimple = this.selectedYakuman = false;
      this.selectedRare = true;
    }
  }

  showSimple() {
    this._makeLinks();
    this.scroller.nativeElement.scrollTop = this._simpleLink.offsetTop;
  }

  showRare() {
    this._makeLinks();
    this.scroller.nativeElement.scrollTop = this._rareLink.offsetTop;
  }

  showYakuman() {
    this._makeLinks();
    this.scroller.nativeElement.scrollTop = this._yakumanLink.offsetTop;
  }
}

