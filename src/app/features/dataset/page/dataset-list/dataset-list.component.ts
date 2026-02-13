import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { Dataset } from '../../model/dataset.model';
import { DatasetService } from '../../service/dataset.service';
import { CopyDatasetComponent } from '../../components/copy-dataset/copy-dataset.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditGroupDatasetDataComponent } from '../../components/edit-group-dataset-data/edit-group-dataset-data.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-dataset-list',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './dataset-list.component.html',
  styleUrl: './dataset-list.component.scss',
})
export class DatasetListComponent implements OnInit, AfterViewInit {
  displayedColumns = [
    'name',
    'filterType',
    'groupName',
    'createdTime',
    'updatedTime',
    'other',
  ];
  dataSource = new MatTableDataSource<Dataset>([]);
  matDialog = inject(MatDialog);
  router = inject(Router);
  snackbarService = inject(SnackbarService);
  datasetService = inject(DatasetService);
  messageBoxService = inject(MessageBoxService);
  route = inject(ActivatedRoute);

  isRefreshing = signal(false);
  sortSignal = signal<string | null>(null);
  ascSignal = signal<boolean>(true);
  filterValue = signal<string>('');

  sortViewChild = viewChild(MatSort);

  ngOnInit() {
    this.getList();
    this.route.queryParamMap.subscribe(params => {
      const sort = params.get('sort');
      const asc = params.get('asc');
      const filter = params.get('filter');

      if (sort) {
        this.sortSignal.set(sort);
      }
      if (asc !== null) {
        this.ascSignal.set(asc === 'true');
      }
      if (filter) {
        this.filterValue.set(filter);
        this.dataSource.filter = filter.trim().toLowerCase();
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sortViewChild();
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'filterType':
          return item.config.type ?? '';
        case 'groupName':
          return item.config.groupName ?? '';
        default:
          return (item as any)[property];
      }
    };
    this.dataSource.filterPredicate = (data: Dataset, filter: string) => {
      const filterLower = filter.toLowerCase();
      return (
        data.name.toLowerCase().includes(filterLower) ||
        (data.config.type?.toLowerCase().includes(filterLower) ?? false) ||
        (data.config.groupName?.toLowerCase().includes(filterLower) ?? false)
      );
    };

    // Restore sort state from signals
    const sort = this.sortViewChild();
    if (sort && this.sortSignal()) {
      setTimeout(() => {
        if (sort.sortChange.observers.length > 0) {
          sort.sort({
            id: this.sortSignal()!,
            start: this.ascSignal() ? 'asc' : 'desc',
            disableClear: false,
          });
        } else {
          sort.sortChange.emit({
            active: this.sortSignal()!,
            direction: this.ascSignal() ? 'asc' : 'desc',
          });
        }
      });
    }
  }

  getList() {
    this.datasetService.getAllDataset().subscribe(res => {
      this.dataSource.data = res;
    });
  }

  onAdd() {
    this.router.navigate(['dataset-edit'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }
  onDelete(e: Dataset) {
    this.messageBoxService
      .openI18N('msg.sureDeleteDataset')
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.datasetService.deleteDataset(e.name).subscribe(() => {
            this.snackbarService.openI18N('msg.deleteSuccess');
            this.getList();
          });
        }
      });
  }
  onEdit(e: Dataset) {
    this.router.navigate(['dataset-edit', e.name], {
      queryParams: this.route.snapshot.queryParams,
    });
  }
  onCopy(e: Dataset) {
    this.matDialog
      .open(CopyDatasetComponent, {
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
  onRefresh(e: Dataset) {
    if (this.isRefreshing()) {
      return;
    }
    this.isRefreshing.set(true);
    this.datasetService.refreshData(e.name).subscribe(
      x => {
        this.snackbarService.openI18N('msg.refreshSuccess');
      },
      e => {
        this.isRefreshing.set(false);
      },
      () => {
        this.isRefreshing.set(false);
      }
    );
  }
  onEditDatasetData(e: Dataset) {
    this.matDialog.open(EditGroupDatasetDataComponent, {
      data: {
        groupName: e.config.groupName,
        primeValue: '',
      },
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValue.set(filterValue);
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.updateQueryParams();
  }

  clearFilter() {
    this.filterValue.set('');
    this.dataSource.filter = '';
    this.updateQueryParams();
  }

  updateQueryParams() {
    const queryParams: any = {};

    if (this.sortSignal()) {
      queryParams['sort'] = this.sortSignal();
      queryParams['asc'] = this.ascSignal();
    }

    if (this.filterValue() !== null || this.filterValue() !== undefined) {
      queryParams['filter'] = this.filterValue();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : null,
      queryParamsHandling: 'merge',
    });
  }

  onSortChange(sort: any) {
    if (sort.direction) {
      this.sortSignal.set(sort.active);
      this.ascSignal.set(sort.direction === 'asc');
    } else {
      this.sortSignal.set(null);
    }
    this.updateQueryParams();
  }
}
