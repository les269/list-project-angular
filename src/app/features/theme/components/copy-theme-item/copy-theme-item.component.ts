import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank } from '../../../../shared/util/helper';
import { CopyThemeItemData } from '../../models';
import { ThemeItemService } from '../../services';
import { EMPTY, switchMap } from 'rxjs';

@Component({
  selector: 'app-copy-theme-item',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
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

  ok() {
    const value = this.targetItemId().trim();
    if (isBlank(value)) {
      this.snackbarService.isBlankMessage('themeItem.targetItemId');
      return;
    }
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
        })
      )
      .subscribe(() => {
        this.snackbarService.openI18N('msg.copySuccess');
        this.dialogRef.close(true);
      });
  }
}
