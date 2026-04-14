import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { SpiderConfig } from '../../model';
import { SpiderConfigService } from '../../services/spider-config.service';

@Component({
  standalone: true,
  selector: 'app-spider-list',
  templateUrl: './spider-list.component.html',
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
  ],
})
export class SpiderListComponent implements OnInit, AfterViewInit {
  displayedColumns = [
    'spiderId',
    'description',
    'primeKeySize',
    'updatedTime',
    'other',
  ];
  dataSource = new MatTableDataSource<SpiderConfig>([]);

  readonly router = inject(Router);
  readonly spiderConfigService = inject(SpiderConfigService);
  readonly snackbarService = inject(SnackbarService);
  readonly messageBoxService = inject(MessageBoxService);

  readonly sort = viewChild(MatSort);

  ngOnInit() {
    this.getList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort()!;
  }

  getList() {
    this.spiderConfigService.getAll().subscribe(res => {
      this.dataSource.data = res;
    });
  }

  onAdd() {
    this.router.navigate(['spider-edit']);
  }

  onEdit(e: SpiderConfig) {
    this.router.navigate(['spider-edit', e.spiderId]);
  }

  onDelete(e: SpiderConfig) {
    this.messageBoxService
      .openI18N('msg.sureDeleteSpider')
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.spiderConfigService.delete(e.spiderId).subscribe(() => {
            this.snackbarService.openI18N('msg.deleteSuccess');
            this.getList();
          });
        }
      });
  }
}
