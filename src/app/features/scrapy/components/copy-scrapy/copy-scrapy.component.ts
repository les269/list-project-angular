import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ScrapyConfig } from '../../model';
import { isBlank } from '../../../../shared/util/helper';
import { EMPTY, switchMap } from 'rxjs';

@Component({
  selector: 'app-copy-scrapy',
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
    CommonModule,
  ],
  templateUrl: './copy-scrapy.component.html',
})
export class CopyScrapyComponent {
  readonly dialogRef = inject(MatDialogRef<CopyScrapyComponent>);
  readonly data = inject<{ source: ScrapyConfig }>(MAT_DIALOG_DATA);
  source: ScrapyConfig = JSON.parse(JSON.stringify(this.data.source));
  constructor(
    private scrapyService: ScrapyService,
    private snackbarService: SnackbarService
  ) {}

  ok() {
    if (isBlank(this.source.name)) {
      this.snackbarService.isBlankMessage('scrapy.name');
      return;
    }
    this.scrapyService
      .existConfig(this.source.name)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openByI18N('msg.scrapyExist');
            return EMPTY;
          }
          return this.scrapyService.updateConfig(this.source);
        })
      )
      .subscribe(() => {
        this.dialogRef.close('ok');
      });
  }
}
