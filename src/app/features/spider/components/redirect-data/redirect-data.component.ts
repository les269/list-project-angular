import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ScrapyPagination } from '../../model';
import { ScrapyPaginationService } from '../../services/scrapy-pagination.service';

@Component({
  selector: 'app-redirect-data',

  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    TranslatePipe,
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
        this.snackbarService.openI18N('msg.updateSuccess');
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
