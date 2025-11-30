import { Component, inject } from '@angular/core';

import { GroupDataset } from '../../model';
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
import { GroupDatasetService } from '../../service/group-dataset.service';

@Component({
  selector: 'app-copy-group-dataset',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule
],
  templateUrl: './copy-group-dataset.component.html',
})
export class CopyGroupDatasetComponent {
  readonly dialogRef = inject(MatDialogRef<CopyGroupDatasetComponent>);
  readonly data = inject<{ source: GroupDataset }>(MAT_DIALOG_DATA);
  source: GroupDataset = JSON.parse(JSON.stringify(this.data.source));
  constructor(
    private groupDatasetService: GroupDatasetService,
    private snackbarService: SnackbarService
  ) {}

  ok() {
    if (isBlank(this.source.groupName)) {
      this.snackbarService.isBlankMessage('scrapy.groupName');
      return;
    }
    this.groupDatasetService
      .existGroupDataset(this.source.groupName)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openByI18N('msg.scrapyExist');
            return EMPTY;
          }
          return this.groupDatasetService.updateGroupDataset(this.source);
        })
      )
      .subscribe(() => {
        this.dialogRef.close('ok');
      });
  }
}
