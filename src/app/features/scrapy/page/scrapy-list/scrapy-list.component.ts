import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScrapyConfig } from '../../model/scrapy.model';
import { ScrapyService } from '../../services/scrapy.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../core/components/message-box/message-box.component';
import { isNotBlank } from '../../../../shared/util/helper';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CopyScrapyComponent } from '../../components/copy-scrapy/copy-scrapy.component';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
  ],
  selector: 'app-scrapy-list',
  templateUrl: 'scrapy-list.component.html',
})
export class ScrapyListComponent implements OnInit, AfterViewInit {
  displayedColumns = ['name', 'createdTime', 'updatedTime', 'other'];
  dataSource = new MatTableDataSource<ScrapyConfig>([]);

  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private translateService: TranslateService,
    private matDialog: MatDialog,
    private router: Router,
    private scapyService: ScrapyService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit() {
    this.getList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  getList() {
    this.scapyService.getAllConfig().subscribe(res => {
      this.dataSource.data = res;
    });
  }

  onAdd() {
    this.router.navigate(['scrapy-edit']);
  }

  onDelete(e: ScrapyConfig) {
    this.matDialog
      .open(MessageBoxComponent, {
        data: {
          message: this.translateService.instant('msg.sureDeleteScrapy'),
        },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.scapyService.deleteConfig(e.name).subscribe(() => {
            this.snackbarService.openByI18N('msg.deleteSuccess');
            this.getList();
          });
        }
      });
  }

  onEdit(e: ScrapyConfig) {
    this.router.navigate(['scrapy-edit', e.name]);
  }

  onCopy(e: ScrapyConfig) {
    this.matDialog
      .open(CopyScrapyComponent, {
        data: { source: e },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.snackbarService.openByI18N('msg.copySuccess');
          this.getList();
        }
      });
  }
}
