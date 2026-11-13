import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  form,
  FormField,
  readonly as readonlyField,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ApiRequestConfig } from '../model';
import { ApiRequestConfigService } from '../service/api-request-config.service';

@Component({
  selector: 'app-copy-api-request-config-dialog',
  templateUrl: './copy-api-request-config.dialog.html',
  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    TranslatePipe,
  ],
})
export class CopyApiRequestConfigDialog {
  readonly data = inject<ApiRequestConfig>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(
    MatDialogRef<CopyApiRequestConfigDialog, boolean>
  );
  private readonly service = inject(ApiRequestConfigService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  readonly isSaving = signal(false);
  readonly saveFailed = signal(false);
  private readonly duplicateApiId = signal('');
  readonly valueModel = signal({
    apiId: '',
    description: this.data.description,
  });
  readonly valueForm = form(this.valueModel, p => {
    readonlyField(p, { when: () => this.isSaving() });
    required(p.apiId);
    validate(p.apiId, ({ value }) => {
      const apiId = value().trim();
      if (!apiId) return value() ? { kind: 'required' } : undefined;
      return apiId === this.duplicateApiId()
        ? { kind: 'duplicateApiId' }
        : undefined;
    });
  });

  onSave(event?: Event): void {
    event?.preventDefault();
    if (this.isSaving()) return;
    this.valueForm().markAsTouched();
    if (this.valueForm().invalid()) return;
    const value = this.valueModel();
    const request: ApiRequestConfig = {
      apiId: value.apiId.trim(),
      description: value.description.trim(),
      config: structuredClone(this.data.config),
    };
    this.isSaving.set(true);
    this.saveFailed.set(false);
    const disableClose = this.dialogRef.disableClose;
    this.dialogRef.disableClose = true;
    this.service
      .exist(request.apiId)
      .pipe(
        switchMap(exists => {
          if (exists) {
            this.duplicateApiId.set(request.apiId);
            return EMPTY;
          }
          return this.service.update(request);
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSaving.set(false);
          this.dialogRef.disableClose = disableClose;
        })
      )
      .subscribe({
        next: () => {
          this.snackbar.openI18N('msg.saveSuccess');
          this.dialogRef.close(true);
        },
        error: () => this.saveFailed.set(true),
      });
  }

  onCancel(): void {
    if (!this.isSaving()) this.dialogRef.close();
  }
}
