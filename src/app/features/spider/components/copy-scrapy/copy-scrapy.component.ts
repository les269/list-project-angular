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
import { ScrapyConfig } from '../../model';
import { ScrapyService } from '../../services/scrapy.service';

@Component({
  selector: 'app-copy-scrapy',

  imports: [
    FormField,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslatePipe,
  ],
  templateUrl: './copy-scrapy.component.html',
})
export class CopyScrapyComponent {
  readonly dialogRef = inject(MatDialogRef<CopyScrapyComponent>);
  readonly data = inject<{ source: ScrapyConfig }>(MAT_DIALOG_DATA);
  readonly sourceModel = signal<ScrapyConfig>(
    JSON.parse(JSON.stringify(this.data.source))
  );
  readonly sourceForm = form(this.sourceModel, p => {
    required(p.name);
  });
  get source() {
    return this.sourceModel();
  }
  set source(value: ScrapyConfig) {
    this.sourceModel.set(value);
  }
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
            this.snackbarService.openI18N('msg.scrapyExist');
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
