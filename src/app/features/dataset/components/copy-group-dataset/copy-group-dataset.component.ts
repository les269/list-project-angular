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
import { TranslatePipe } from '@ngx-translate/core';
import { EMPTY, switchMap } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank } from '../../../../shared/util/helper';
import { GroupDataset } from '../../model';
import { GroupDatasetService } from '../../service/group-dataset.service';

@Component({
  selector: 'app-copy-group-dataset',

  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslatePipe,
  ],
  templateUrl: './copy-group-dataset.component.html',
})
export class CopyGroupDatasetComponent {
  readonly dialogRef = inject(MatDialogRef<CopyGroupDatasetComponent>);
  readonly data = inject<{ source: GroupDataset }>(MAT_DIALOG_DATA);
  readonly sourceModel = signal<GroupDataset>(
    JSON.parse(JSON.stringify(this.data.source))
  );
  readonly sourceForm = form(this.sourceModel, p => {
    required(p.groupName);
  });
  get source() {
    return this.sourceModel();
  }
  set source(value: GroupDataset) {
    this.sourceModel.set(value);
  }
  private readonly groupDatasetService = inject(GroupDatasetService);
  private readonly snackbarService = inject(SnackbarService);

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
            this.snackbarService.openI18N('msg.scrapyExist');
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
