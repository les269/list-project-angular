import { Component, inject, input } from '@angular/core';

import {
  ThemeHeaderType,
  ThemeTopCustom,
  ThemeTopCustomValue,
  ThemeTopCustomValueResponse,
} from '../../../theme/models';
import { MatIconModule } from '@angular/material/icon';
import { isNotBlank, isNotNull } from '../../../../shared/util/helper';
import { MatDialog } from '@angular/material/dialog';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { ThemeService } from '../../../theme/services/theme.service';
import { ThemeNoteComponent } from '../../../theme/components/theme-note/theme-note.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';

@Component({
  selector: 'app-top-custom-buttons',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './top-custom-buttons.component.html',
  styleUrl: './top-custom-buttons.component.scss',
})
export class TopCustomButtonsComponent {
  themeTopCustomList = input.required<ThemeTopCustom[]>();
  headerId = input.required<string>();
  topCustomValueMap = input.required<ThemeTopCustomValueResponse>();
  type = input.required<ThemeHeaderType>();

  themeService = inject(ThemeService);
  matDialog = inject(MatDialog);
  apiConfigService = inject(ApiConfigService);
  snackbarService = inject(SnackbarService);

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
          title: custom.label,
          value: this.getCustomValue(custom) ?? '',
          disabled: type === 'read',
          save: (result: string) => {
            if (isNotNull(result)) {
              this.changeCustomValue(custom, result, {
                isDialogSave: true,
              });
            }
          },
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
    return isNotBlank(this.topCustomValueMap()[custom.byKey]);
  }

  getCustomValue(custom: ThemeTopCustom) {
    if (this.checkCustomValueExist(custom)) {
      return this.topCustomValueMap()[custom.byKey];
    }
    return '';
  }
  changeCustomValue(
    custom: ThemeTopCustom,
    value: string,
    options?: { isDialogSave?: boolean }
  ) {
    let req: ThemeTopCustomValue = {
      headerId: this.headerId(),
      byKey: custom.byKey,
      customValue: value,
    };

    this.themeService.updateTopCustomValue(req).subscribe(() => {
      this.topCustomValueMap()[req.byKey] = value;
      if (options?.isDialogSave) {
        this.snackbarService.openI18N('msg.saveSuccess');
      }
    });
  }
}
