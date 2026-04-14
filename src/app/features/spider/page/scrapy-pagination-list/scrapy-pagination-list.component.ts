import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ScrapyConfig, ScrapyPagination } from '../../model';
import { ScrapyService } from '../../services/scrapy.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { CopyScrapyComponent } from '../../components/copy-scrapy/copy-scrapy.component';
import { ScrapyPaginationService } from '../../services/scrapy-pagination.service';
import { CopyScrapyPaginationComponent } from '../../components/copy-scrapy-pagination/copy-scrapy-pagination.component';
import { RedirectDataComponent } from '../../components/redirect-data/redirect-data.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MessageBoxService } from '../../../../core/services/message-box.service';

@Component({
  selector: 'app-scrapy-pagination-list',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
  ],
  templateUrl: './scrapy-pagination-list.component.html',
})
export class ScrapyPaginationListComponent implements AfterViewInit {
  displayedColumns = ['name', 'createdTime', 'updatedTime', 'other'];
  dataSource = new MatTableDataSource<ScrapyPagination>([]);

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private translateService: TranslateService,
    private matDialog: MatDialog,
    private router: Router,
    private scrapyPaginationService: ScrapyPaginationService,
    private snackbarService: SnackbarService,
    private messageBoxService: MessageBoxService
  ) {}

  ngOnInit() {
    this.getList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  getList() {
    this.scrapyPaginationService.getAll().subscribe(res => {
      this.dataSource.data = res;
    });
  }

  onAdd() {
    this.router.navigate(['scrapy-pagination-edit']);
  }

  onDelete(e: ScrapyPagination) {
    this.messageBoxService
      .openI18N('msg.sureDeleteScrapy')
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.scrapyPaginationService.delete(e.name).subscribe(() => {
            this.snackbarService.openI18N('msg.deleteSuccess');
            this.getList();
          });
        }
      });
  }

  onEdit(e: ScrapyPagination) {
    this.router.navigate(['scrapy-pagination-edit', e.name]);
  }

  onRedirectData(e: ScrapyPagination) {
    this.matDialog
      .open(RedirectDataComponent, {
        data: { source: e },
      })
      .afterClosed()
      .subscribe(result => {
        this.getList();
      });
  }

  onCopy(e: ScrapyPagination) {
    this.matDialog
      .open(CopyScrapyPaginationComponent, {
        data: { source: e },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.snackbarService.openI18N('msg.copySuccess');
          this.getList();
        }
      });
  }
}
