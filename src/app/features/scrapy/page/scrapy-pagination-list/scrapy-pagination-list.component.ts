import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ScrapyConfig, ScrapyPagination } from '../../model';
import { ScrapyService } from '../../services/scrapy.service';
import { MessageBoxComponent } from '../../../../core/components/message-box/message-box.component';
import { isNotBlank } from '../../../../shared/util/helper';
import { CopyScrapyComponent } from '../../components/copy-scrapy/copy-scrapy.component';
import { ScrapyPaginationService } from '../../services/scrapy-pagination.service';

@Component({
  selector: 'app-scrapy-pagination-list',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './scrapy-pagination-list.component.html',
})
export class ScrapyPaginationListComponent {
  displayedColumns = ['name', 'createdTime', 'updatedTime', 'other'];
  list: ScrapyPagination[] = [];

  constructor(
    private translateService: TranslateService,
    private matDialog: MatDialog,
    private router: Router,
    private scrapyPaginationService: ScrapyPaginationService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit() {
    this.getList();
  }

  getList() {
    this.scrapyPaginationService.getAll().subscribe(res => {
      this.list = res;
    });
  }

  onAdd() {
    this.router.navigate(['scrapy-pagination-edit']);
  }

  onDelete(index: number) {
    this.matDialog
      .open(MessageBoxComponent, {
        data: {
          message: this.translateService.instant('msg.sureDeleteScrapy'),
        },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.scrapyPaginationService
            .delete(this.list[index].name)
            .subscribe(() => {
              this.snackbarService.openByI18N('msg.deleteSuccess');
              this.getList();
            });
        }
      });
  }

  onEdit(index: number) {
    this.router.navigate(['scrapy-pagination-edit', this.list[index].name]);
  }

  onCopy(index: number) {
    // this.matDialog
    //   .open(CopyScrapyComponent, {
    //     data: { source: this.list[index] },
    //   })
    //   .afterClosed()
    //   .subscribe(result => {
    //     if (isNotBlank(result)) {
    //       this.snackbarService.openByI18N('msg.copySuccess');
    //       this.getList();
    //     }
    //   });
  }
}
