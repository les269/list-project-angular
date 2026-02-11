import { Component, inject } from '@angular/core';

import { Dataset } from '../../model';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap, EMPTY } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank } from '../../../../shared/util/helper';
import { DatasetService } from '../../service/dataset.service';

@Component({
  selector: 'app-copy-dataset',
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
  ],
  templateUrl: './copy-dataset.component.html',
})
export class CopyDatasetComponent {
  readonly dialogRef = inject(MatDialogRef<CopyDatasetComponent>);
  readonly data = inject<{ source: Dataset }>(MAT_DIALOG_DATA);
  source: Dataset = JSON.parse(JSON.stringify(this.data.source));
  constructor(
    private datasetService: DatasetService,
    private snackbarService: SnackbarService
  ) {}

  ok() {
    if (isBlank(this.source.name)) {
      this.snackbarService.isBlankMessage('scrapy.name');
      return;
    }
    this.datasetService
      .existDataset(this.source.name)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openI18N('msg.scrapyExist');
            return EMPTY;
          }
          return this.datasetService.updateDataset(this.source);
        })
      )
      .subscribe(() => {
        this.dialogRef.close('ok');
      });
  }
}
