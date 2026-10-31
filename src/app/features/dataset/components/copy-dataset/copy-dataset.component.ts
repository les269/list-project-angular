import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

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
import { EMPTY, switchMap } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank } from '../../../../shared/util/helper';
import { Dataset } from '../../model';
import { DatasetService } from '../../service/dataset.service';

@Component({
  selector: 'app-copy-dataset',

  imports: [
    TrimOnBlurDirective,
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
  ],
  templateUrl: './copy-dataset.component.html',
})
export class CopyDatasetComponent {
  readonly dialogRef = inject(MatDialogRef<CopyDatasetComponent>);
  readonly data = inject<{ source: Dataset }>(MAT_DIALOG_DATA);
  readonly sourceModel = signal<Dataset>(
    JSON.parse(JSON.stringify(this.data.source))
  );
  readonly sourceForm = form(this.sourceModel, p => {
    required(p.name);
  });
  get source() {
    return this.sourceModel();
  }
  set source(value: Dataset) {
    this.sourceModel.set(value);
  }
  private readonly datasetService = inject(DatasetService);
  private readonly snackbarService = inject(SnackbarService);

  ok() {
    const source = structuredClone(this.sourceForm().value());
    source.name = source.name.trim();
    if (isBlank(source.name)) {
      this.snackbarService.isBlankMessage('dataset.name');
      return;
    }
    this.datasetService
      .existDataset(source.name)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openI18N('msg.datasetExist');
            return EMPTY;
          }
          return this.datasetService.updateDataset(source);
        })
      )
      .subscribe(() => {
        this.dialogRef.close('ok');
      });
  }
}
