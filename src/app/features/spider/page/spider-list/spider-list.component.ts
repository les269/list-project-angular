import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { SpiderConfig } from '../../model';
import { SpiderConfigService } from '../../services/spider-config.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-spider-list',
  templateUrl: './spider-list.component.html',
  styleUrl: './spider-list.component.scss',
  imports: [
    TranslatePipe,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSortModule,
  ],
})
export class SpiderListComponent {
  readonly router = inject(Router);
  readonly spiderConfigService = inject(SpiderConfigService);
  readonly snackbarService = inject(SnackbarService);
  readonly messageBoxService = inject(MessageBoxService);

  readonly displayedColumns = [
    'spiderId',
    'description',
    'primeKeySize',
    'updatedTime',
    'other',
  ];

  readonly sort = viewChild(MatSort);
  readonly filterValue = signal('');

  readonly list = rxResource({
    stream: () => this.spiderConfigService.getAll(),
    defaultValue: [] as SpiderConfig[],
  });

  readonly filteredList = computed(() => {
    const data = this.list.value();
    const filter = this.filterValue().trim().toLowerCase();
    return filter
      ? data.filter(
          item =>
            item.spiderId.toLowerCase().includes(filter) ||
            (item.description ?? '').toLowerCase().includes(filter)
        )
      : data;
  });

  readonly dataSource = computed(() => {
    const data = this.filteredList();
    const sort = this.sort();
    const dataSource = new MatTableDataSource<SpiderConfig>(data);
    if (sort) {
      dataSource.sort = sort;
    }
    return dataSource;
  });

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
            this.list.reload();
          });
        }
      });
  }
}
