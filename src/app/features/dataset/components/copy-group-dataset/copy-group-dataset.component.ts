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
import { GroupDataset } from '../../model';
import { GroupDatasetService } from '../../service/group-dataset.service';

@Component({
  selector: 'app-copy-group-dataset',

  imports: [
    SignalFieldComponent,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslatePipe,
  ],
  templateUrl: './copy-group-dataset.component.html',
  styleUrl: './copy-group-dataset.component.scss',
})
export class CopyGroupDatasetComponent {
  readonly dialogRef = inject(MatDialogRef<CopyGroupDatasetComponent>);
  readonly data = inject<{ source: GroupDataset }>(MAT_DIALOG_DATA);
  private readonly groupDatasetService = inject(GroupDatasetService);
  private readonly snackbarService = inject(SnackbarService);
  readonly isProcessing = signal(false);
  readonly sourceModel = signal<GroupDataset>(
    JSON.parse(JSON.stringify(this.data.source))
  );
  readonly sourceForm = form(this.sourceModel, p => {
    required(p.groupName, { message: 'msg.required' });
    readonly(p, { when: () => this.isProcessing() });
  });
  get source() {
    return this.sourceModel();
  }
  set source(value: GroupDataset) {
    this.sourceModel.set(value);
  }

  ok() {
    if (this.isProcessing()) return;
    this.sourceForm().markAsTouched();
    const source = structuredClone(this.sourceForm().value());
    if (isBlank(source.groupName)) {
      this.snackbarService.isBlankMessage('dataset.groupName');
      return;
    }
    this.isProcessing.set(true);
    const wasDisableClose = this.dialogRef.disableClose;
    this.dialogRef.disableClose = true;
    this.groupDatasetService
      .existGroupDataset(source.groupName)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openI18N('msg.scrapyExist');
            return EMPTY;
          }
          return this.groupDatasetService.updateGroupDataset(source);
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
