import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ThemeHeaderType,
  ThemeTopCustom,
  ThemeTopCustomValue,
  ThemeTopCustomValueResponse,
} from '../../models';
import { MatIconModule } from '@angular/material/icon';
import {
  isNotBlank,
  isNotNull,
  parseHeaderId,
} from '../../../../shared/util/helper';
import { MatDialog } from '@angular/material/dialog';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { ThemeService } from '../../services/theme.service';
import { ThemeNoteComponent } from '../theme-note/theme-note.component';

@Component({
  selector: 'app-top-custom-buttons',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './top-custom-buttons.component.html',
  styleUrl: './top-custom-buttons.component.scss',
})
export class TopCustomButtonsComponent implements OnInit {
  @Input({ required: true }) themeTopCustomList: ThemeTopCustom[] = [];
  @Input({ required: true }) headerId: string = '';
  @Input({ required: true }) topCustomValueMap: ThemeTopCustomValueResponse =
    {};
  type: ThemeHeaderType = ThemeHeaderType.imageList;
  constructor(
    private themeService: ThemeService,
    private matDialog: MatDialog,
    private apiConfigService: ApiConfigService
  ) {}
  ngOnInit(): void {
    if (isNotBlank(this.headerId)) {
      const id = parseHeaderId(this.headerId);
      if (id) {
        this.type = id.type;
      }
    }
  }

  openNewPage(text: string) {
    window.open(text, '_blank');
  }

  callApi(custom: ThemeTopCustom) {
    if (custom.apiConfig) {
      this.apiConfigService.callSingleApi(custom.apiConfig, null);
    }
  }

  openNoteDialog(custom: ThemeTopCustom, type: 'read' | 'write') {
    this.matDialog
      .open(ThemeNoteComponent, {
        data: {
          value: this.getCustomValue(custom) ?? '',
          disabled: type === 'read',
        },
        panelClass: 'dialog-responsive',
        height: '80vh',
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotNull(result)) {
          this.changeCustomValue(custom, result);
        }
      });
  }
  /**
   * 檢查是否有存在自訂字串
   * @param data
   * @param custom
   * @returns
   */
  checkCustomValueExist(custom: ThemeTopCustom): boolean {
    return isNotBlank(this.topCustomValueMap[custom.byKey]);
  }

  getCustomValue(custom: ThemeTopCustom) {
    if (this.checkCustomValueExist(custom)) {
      return this.topCustomValueMap[custom.byKey];
    }
    return '';
  }
  changeCustomValue(custom: ThemeTopCustom, value: string) {
    let req: ThemeTopCustomValue = {
      headerId: this.headerId,
      byKey: custom.byKey,
      customValue: value,
    };

    this.themeService.updateTopCustomValue(req).subscribe(() => {
      this.topCustomValueMap[req.byKey] = value;
    });
  }
}
