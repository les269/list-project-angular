import { Component, inject, signal } from '@angular/core';
import { disabled, form, required } from '@angular/forms/signals';
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
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SpiderPagination } from '../../model';
import { SpiderPaginationService } from '../../services';

@Component({
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    SignalFieldComponent,
    TranslateModule,
  ],
  selector: 'app-copy-spider-pagination',
  templateUrl: './copy-spider-pagination.component.html',
})
export class CopySpiderPaginationComponent {
  readonly dialogRef = inject(
    MatDialogRef<CopySpiderPaginationComponent, string>
  );
  readonly data = inject<{ source: SpiderPagination }>(MAT_DIALOG_DATA);
  readonly spiderPaginationService = inject(SpiderPaginationService);
  readonly snackbarService = inject(SnackbarService);
  readonly saving = signal(false);
  readonly model = signal({ spiderPaginationId: '' });
  readonly form = form(this.model, path => {
    required(path.spiderPaginationId);
    disabled(path, { when: () => this.saving() });
  });

  ok() {
    if (this.saving()) return;
    const spiderPaginationId = this.model().spiderPaginationId.trim();
    this.model.set({ spiderPaginationId });
    if (!spiderPaginationId) {
      this.form().markAsTouched();
      this.snackbarService.isBlankMessage(
        'spiderPagination.spiderPaginationId'
      );
      return;
    }
    if (spiderPaginationId === this.data.source.spiderPaginationId) {
      this.snackbarService.openI18N('msg.spiderExist');
      return;
    }
    // 查重與保存使用同一份快照，新的資料不沿用原本的建立及更新時間。
    const request: SpiderPagination = {
      spiderPaginationId,
      paginationConfig: structuredClone(this.data.source.paginationConfig),
    };
    const disableClose = this.dialogRef.disableClose;
    this.saving.set(true);
    this.dialogRef.disableClose = true;
    this.spiderPaginationService
      .isInUse(spiderPaginationId)
      .pipe(
        switchMap(exist => {
          if (exist) {
            this.snackbarService.openI18N('msg.spiderExist');
            return EMPTY;
          }
          return this.spiderPaginationService.update(request);
        }),
        // HTTP 錯誤由共用 interceptor 顯示，保留 dialog 供使用者重試。
        catchError(() => EMPTY),
        finalize(() => {
          this.saving.set(false);
          this.dialogRef.disableClose = disableClose;
        })
      )
      .subscribe(() => this.dialogRef.close('ok'));
  }
}
