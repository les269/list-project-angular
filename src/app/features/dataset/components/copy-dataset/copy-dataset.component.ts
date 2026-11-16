import { Component, inject, signal } from '@angular/core';
import { form, readonly, required } from '@angular/forms/signals';

import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank } from '../../../../shared/util/helper';
import { Dataset } from '../../model';
import { DatasetService } from '../../service/dataset.service';

@Component({
  selector: 'app-copy-dataset',

  imports: [
    SignalFieldComponent,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslatePipe,
  ],
  templateUrl: './copy-dataset.component.html',
  styleUrl: './copy-dataset.component.scss',
})
export class CopyDatasetComponent {
  readonly dialogRef = inject(MatDialogRef<CopyDatasetComponent>);
  readonly data = inject<{ source: Dataset }>(MAT_DIALOG_DATA);
  private readonly datasetService = inject(DatasetService);
  private readonly snackbarService = inject(SnackbarService);
  readonly isProcessing = signal(false);
  readonly sourceModel = signal<Dataset>(
    JSON.parse(JSON.stringify(this.data.source))
  );
  readonly sourceForm = form(this.sourceModel, p => {
    required(p.name, { message: 'msg.required' });
    readonly(p, { when: () => this.isProcessing() });
  });
  get source() {
    return this.sourceModel();
  }
  set source(value: Dataset) {
    this.sourceModel.set(value);
  }

  ok() {
    if (this.isProcessing()) return;
    this.sourceForm().markAsTouched();
    const source = structuredClone(this.sourceForm().value());
    source.name = source.name.trim();
    if (isBlank(source.name)) {
      this.snackbarService.isBlankMessage('dataset.name');
      return;
    }
    this.isProcessing.set(true);
    const wasDisableClose = this.dialogRef.disableClose;
    this.dialogRef.disableClose = true;
    this.datasetService
      .existDataset(source.name)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openI18N('msg.datasetExist');
            return EMPTY;
          }
          return this.datasetService.updateDataset(source);
        }),
        finalize(() => {
          this.isProcessing.set(false);
          this.dialogRef.disableClose = wasDisableClose;
        })
      )
      .subscribe({
        next: () => this.dialogRef.close('ok'),
        error: () => {},
      });
  }
}
