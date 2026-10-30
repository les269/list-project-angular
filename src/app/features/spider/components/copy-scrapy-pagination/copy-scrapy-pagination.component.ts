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
import { ScrapyPagination } from '../../model';
import { ScrapyPaginationService } from '../../services/scrapy-pagination.service';

@Component({
  selector: 'app-copy-scrapy-pagination',

  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
  ],
  templateUrl: './copy-scrapy-pagination.component.html',
})
export class CopyScrapyPaginationComponent {
  readonly dialogRef = inject(MatDialogRef<CopyScrapyPaginationComponent>);
  readonly data = inject<{ source: ScrapyPagination }>(MAT_DIALOG_DATA);
  readonly sourceModel = signal<ScrapyPagination>(
    JSON.parse(JSON.stringify(this.data.source))
  );
  readonly sourceForm = form(this.sourceModel, p => {
    required(p.name);
  });
  get source() {
    return this.sourceModel();
  }
  set source(value: ScrapyPagination) {
    this.sourceModel.set(value);
  }
  constructor(
    private scrapyPaginationService: ScrapyPaginationService,
    private snackbarService: SnackbarService
  ) {}

  ok() {
    if (isBlank(this.source.name)) {
      this.snackbarService.isBlankMessage('scrapy.name');
      return;
    }
    this.scrapyPaginationService
      .exist(this.source.name)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openI18N('msg.scrapyExist');
            return EMPTY;
          }
          return this.scrapyPaginationService.update(this.source);
        })
      )
      .subscribe(() => {
        this.dialogRef.close('ok');
      });
  }
}
