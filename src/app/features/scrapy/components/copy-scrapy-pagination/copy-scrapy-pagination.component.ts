import { Component, inject } from '@angular/core';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ScrapyService } from '../../services/scrapy.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ThemeHeaderType } from '../../../theme/models';
import {
  ScrapyConfig,
  ScrapyPagination,
  ScrapyPaginationConfig,
} from '../../model';
import { isBlank } from '../../../../shared/util/helper';
import { EMPTY, switchMap } from 'rxjs';
import { ScrapyPaginationService } from '../../services/scrapy-pagination.service';

@Component({
  selector: 'app-copy-scrapy-pagination',
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
  templateUrl: './copy-scrapy-pagination.component.html',
})
export class CopyScrapyPaginationComponent {
  readonly dialogRef = inject(MatDialogRef<CopyScrapyPaginationComponent>);
  readonly data = inject<{ source: ScrapyPagination }>(MAT_DIALOG_DATA);
  source: ScrapyPagination = JSON.parse(JSON.stringify(this.data.source));
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
            this.snackbarService.openByI18N('msg.scrapyExist');
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
