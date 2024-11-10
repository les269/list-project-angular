import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScrapyConfig, ScrapyData } from '../../model/scrapy.model';
import { ScrapyService } from '../../services/scrapy.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../core/components/message-box/message-box.component';
import { isNotBlank } from '../../../../shared/util/helper';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CopyScrapyComponent } from '../../components/copy-scrapy/copy-scrapy.component';

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  selector: 'app-scrapy-list',
  templateUrl: 'scrapy-list.component.html',
  styleUrl: 'scrapy-list.component.scss',
})
export class ScrapyListComponent implements OnInit {
  displayedColumns = ['name', 'createdTime', 'updatedTime', 'other'];
  list: ScrapyConfig[] = [];
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

  getList() {
    this.scapyService.getAllConfig().subscribe(res => {
      this.list = res;
    });
  }

  onAdd() {
    this.router.navigate(['scrapy-edit']);
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
          this.scapyService
            .deleteConfig(this.list[index].name)
            .subscribe(() => {
              this.snackbarService.openByI18N('msg.deleteSuccess');
              this.getList();
            });
        }
      });
  }

  onEdit(index: number) {
    this.router.navigate(['scrapy-edit', this.list[index].name]);
  }

  onCopy(index: number) {
    this.matDialog
      .open(CopyScrapyComponent, {
        data: { source: this.list[index] },
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
