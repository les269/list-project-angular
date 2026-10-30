import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, readonly, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank } from '../../../../shared/util/helper';
import { CopyThemeItemData } from '../../models';
import { ThemeItemService } from '../../services';

@Component({
  selector: 'app-copy-theme-item',

  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './copy-theme-item.component.html',
})
export class CopyThemeItemComponent {
  readonly dialogRef = inject(MatDialogRef<CopyThemeItemComponent>);
  readonly data = inject<CopyThemeItemData>(MAT_DIALOG_DATA);

  readonly snackbarService = inject(SnackbarService);
  readonly themeItemService = inject(ThemeItemService);

  readonly targetItemId = signal('');
  readonly isProcessing = signal(false);

  readonly targetItemIdForm = form(this.targetItemId, p => {
    required(p);
    readonly(p, { when: () => this.isProcessing() });
  });

  ok() {
    if (this.isProcessing()) return;
    this.targetItemIdForm().markAsTouched();
    const value = this.targetItemId().trim();
    if (isBlank(value)) {
      this.snackbarService.isBlankMessage('themeItem.targetItemId');
      return;
    }
    this.isProcessing.set(true);
    const wasDisableClose = this.dialogRef.disableClose;
    this.dialogRef.disableClose = true;
    this.themeItemService
      .getThemeItem(this.data.type, value)
      .pipe(
        switchMap(x => {
          if (x) {
            this.snackbarService.openI18N('themeItem.exist', { value });
            return EMPTY;
          }
          return this.themeItemService.copyThemeItem({
            sourceItemId: this.data.sourceItemId,
            targetItemId: value,
            type: this.data.type,
          });
        }),
        finalize(() => {
          this.isProcessing.set(false);
          this.dialogRef.disableClose = wasDisableClose;
        })
      )
      .subscribe({
        next: () => {
          this.snackbarService.openI18N('msg.copySuccess');
          this.dialogRef.close(true);
        },
        error: () => {},
      });
  }
}
