import {
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SpiderPagination } from '../../model';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SpiderPaginationService } from '../../services';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { isNotBlank } from '../../../../shared/util/helper';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs';
import { CopySpiderPaginationComponent } from '../../components/copy-spider-pagination/copy-spider-pagination.component';

@Component({
  selector: 'app-spider-pagination-list',
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
  ],
  templateUrl: './spider-pagination-list.component.html',
})
export class SpiderPaginationListComponent {
  readonly displayedColumns = [
    'spiderPaginationId',
    'createdTime',
    'updatedTime',
    'other',
  ];

  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly spiderPaginationService = inject(SpiderPaginationService);
  readonly snackbarService = inject(SnackbarService);
  readonly messageBoxService = inject(MessageBoxService);
  readonly matDialog = inject(MatDialog);

  readonly sort = viewChild(MatSort);

  readonly list = rxResource({
    stream: () => this.spiderPaginationService.getAll(),
    defaultValue: [] as SpiderPagination[],
  });
  readonly queryParams = toSignal(
    this.route.queryParamMap.pipe(
      map(p => ({
        sort: p.get('sort') ?? '',
        asc: p.get('asc') === 'true',
        search: p.get('searchValue') ?? '',
      }))
    ),
    { initialValue: { sort: '', asc: true, search: '' } }
  );
  readonly sortSignal = computed(() => this.queryParams().sort);
  readonly ascSignal = computed(() => this.queryParams().asc);
  readonly searchSignal = computed(() => this.queryParams().search);

  readonly dataSource = computed(() => {
    const data = this.list.value() ?? [];
    const sort = this.sort();
    const dataSource = new MatTableDataSource<SpiderPagination>(data);
    if (sort) {
      dataSource.sort = sort;
    }
    return dataSource;
  });

  onAdd() {
    this.router.navigate(['spider-pagination-edit']);
  }

  onEdit(e: SpiderPagination) {
    this.router.navigate(['spider-pagination-edit', e.spiderPaginationId]);
  }

  onDelete(e: SpiderPagination) {
    this.messageBoxService
      .openI18N('msg.sureDeleteSpider')
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.spiderPaginationService
            .delete(e.spiderPaginationId)
            .subscribe(() => {
              this.snackbarService.openI18N('msg.deleteSuccess');
              this.list.reload();
            });
        }
      });
  }

  onRedirectData(e: SpiderPagination) {}
  onCopy(e: SpiderPagination) {
    this.matDialog
      .open(CopySpiderPaginationComponent, {
        data: { source: e },
      })
      .afterClosed()
      .subscribe(result => {
        if (result === 'ok') {
          this.snackbarService.openI18N('msg.copySuccess');
          this.list.reload();
        }
      });
  }

  onSortChange(event: Sort) {
    const sort = event.active;
    const asc = event.direction === 'asc';
    this.router.navigate([], {
      queryParams: { sort, asc },
      queryParamsHandling: 'merge',
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.router.navigate([], {
      queryParams: { searchValue: filterValue },
      queryParamsHandling: 'merge',
    });
  }
  clearFilter() {
    this.router.navigate([], {
      queryParams: { searchValue: '' },
      queryParamsHandling: 'merge',
    });
  }
}
