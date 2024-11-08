import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  ThemeCustom,
  ThemeCustomValue,
  ThemeCustomValueResponse,
} from '../../models';
import {
  isBlank,
  isNotNull,
  isNull,
  replaceValue,
} from '../../../../shared/util/helper';
import { ThemeService } from '../../services/theme.service';
import { ButtonInputUrlDialog } from '../button-input-url.dialog';
import { MatDialog } from '@angular/material/dialog';
import { ThemeNoteComponent } from '../theme-note/theme-note.component';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { UtilDirective } from '../../../../shared/util/util.directive';

@Component({
  selector: 'app-custom-buttons',
  standalone: true,
  imports: [CommonModule, MatIconModule, UtilDirective],
  templateUrl: './custom-buttons.component.html',
  styleUrl: './custom-buttons.component.scss',
})
export class CustomButtonsComponent {
  @Input({ required: true }) themeCustomList: ThemeCustom[] = [];
  @Input({ required: true }) data: any;
  @Input({ required: true }) headerId: string = '';
  @Input({ required: true }) defaultKey: string = '';
  @Input({ required: true }) customValueMap: ThemeCustomValueResponse = {};
  replaceValue = replaceValue;

  constructor(
    private themeService: ThemeService,
    private matDialog: MatDialog,
    private apiConfigService: ApiConfigService
  ) {}

  /**
   * 檢查是否有存在自訂字串
   * @param data
   * @param custom
   * @returns
   */
  checkCustomValueExist(data: any, custom: ThemeCustom): boolean {
    if (
      isBlank(this.defaultKey) ||
      isBlank(data[this.defaultKey]) ||
      isNull(this.customValueMap[data[this.defaultKey]]) ||
      isNull(this.customValueMap[data[this.defaultKey]][custom.byKey])
    ) {
      return false;
    }
    return true;
  }

  getCustomValue(data: any, custom: ThemeCustom) {
    if (this.checkCustomValueExist(data, custom)) {
      return this.customValueMap[data[this.defaultKey]][custom.byKey];
    }
    return '';
  }

  /**
   * 取得UI要使用的自定義資料的字串
   * @param data
   * @param custom
   * @returns
   */
  getCustomValueForUI(data: any, custom: ThemeCustom) {
    let result: any = '';
    let value = '';
    if (this.checkCustomValueExist(data, custom)) {
      value = this.customValueMap[data[this.defaultKey]][custom.byKey];
    }

    switch (custom.type) {
      case 'buttonIconBoolean':
        if (isBlank(value) || value === 'true') {
          result = custom.buttonIconTrue;
        } else {
          result = custom.buttonIconFalse;
        }
        break;
      case 'buttonIconFill':
        result = value === 'true';
        break;
    }
    return result;
  }

  /**
   * 執行更新自定義字串
   * @param custom
   * @param data
   * @param value
   */
  changeCustomValue(data: any, custom: ThemeCustom, value?: any) {
    let req: ThemeCustomValue = {
      headerId: this.headerId,
      byKey: custom.byKey,
      correspondDataValue: data[this.defaultKey],
      customValue: value,
    };
    let x = this.getCustomValue(data, custom);
    //定義每種資料改變方式
    switch (custom.type) {
      case 'buttonIconBoolean':
        req.customValue = isBlank(x) || x === 'true' ? 'false' : 'true';
        break;
      case 'buttonIconFill':
        req.customValue = !(x === 'true') + '';
        break;
      case 'buttonInputUrl':
        req.customValue = value;
        break;
    }

    this.themeService.updateCustomValue(req).subscribe(() => {
      this.customValueMap[req.correspondDataValue][req.byKey] = req.customValue;
    });
  }

  openButtonInputUrlDialog(data: any, custom: ThemeCustom) {
    const dialogRef = this.matDialog.open(ButtonInputUrlDialog, {
      width: '600px',
      data: this.getCustomValue(data, custom),
    });

    dialogRef.afterClosed().subscribe(result => {
      if (isNotNull(result)) {
        this.changeCustomValue(data, custom, result);
      }
    });
  }

  openNewPage(text: string) {
    window.open(text, '_blank');
  }

  onOpenUrl(data: any, custom: ThemeCustom) {
    this.openNewPage(replaceValue(custom.openUrl, data));
  }

  openNoteDialog(data: any, custom: ThemeCustom, type: 'read' | 'write') {
    this.matDialog
      .open(ThemeNoteComponent, {
        data: {
          value: this.getCustomValue(data, custom) ?? '',
          disabled: type === 'read',
        },
        panelClass: 'dialog-responsive',
        height: '80vh',
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotNull(result)) {
          this.changeCustomValue(data, custom, result);
        }
      });
  }

  callApi(data: any, custom: ThemeCustom) {
    if (custom.apiConfig) {
      this.apiConfigService.callSingleApi(custom.apiConfig, data);
    }
  }
}
