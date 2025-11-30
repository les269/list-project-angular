import { Component, inject, OnInit } from '@angular/core';
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
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ScrapyPagination } from '../../model';
import { ScrapyPaginationService } from '../../services/scrapy-pagination.service';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-redirect-data',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
    MatListModule,
  ],
  templateUrl: './redirect-data.component.html',
  styleUrl: './redirect-data.component.scss',
})
export class RedirectDataComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<RedirectDataComponent>);
  readonly data = inject<{ source: ScrapyPagination }>(MAT_DIALOG_DATA);
  source: ScrapyPagination = JSON.parse(JSON.stringify(this.data.source));
  keyRedirectUrl: { key: string; redirectUrl: string }[] = [];

  constructor(
    private scrapyPaginationService: ScrapyPaginationService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.updateKeyRedirectUrl();
  }

  update() {
    this.scrapyPaginationService
      .updateRedirectData(this.source.name)
      .subscribe(res => {
        this.source = res;
        this.updateKeyRedirectUrl();
        this.snackbarService.openByI18N('msg.updateSuccess');
      });
  }
  updateKeyRedirectUrl() {
    this.keyRedirectUrl = Object.entries(
      this.source.config.keyRedirectUrlMap
    ).flatMap(x => ({
      key: x[0],
      redirectUrl: x[1],
    }));
  }
}
