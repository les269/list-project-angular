import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GroupDataset } from '../../model';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { CopyGroupDatasetComponent } from '../../components/copy-group-dataset/copy-group-dataset.component';
import { EditGroupDatasetDataComponent } from '../../components/edit-group-dataset-data/edit-group-dataset-data.component';
import { GroupDatasetImportExportComponent } from '../../components/group-dataset-import-export/group-dataset-import-export.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-group-dataset-list',
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
  templateUrl: './group-dataset-list.component.html',
  styleUrl: './group-dataset-list.component.scss',
})
export class GroupDatasetListComponent implements OnInit, AfterViewInit {
  displayedColumns = ['groupName', 'createdTime', 'updatedTime', 'other'];
  dataSource = new MatTableDataSource<GroupDataset>([]);

  readonly translateService = inject(TranslateService);
  readonly matDialog = inject(MatDialog);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly snackbarService = inject(SnackbarService);
  readonly groupDatasetService = inject(GroupDatasetService);
  readonly messageBoxService = inject(MessageBoxService);

  readonly sortViewChild = viewChild(MatSort);

  readonly sortSignal = signal<string | null>(null);
  readonly ascSignal = signal<boolean>(true);
  readonly filterValue = signal<string>('');

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
    this.dataSource.sort = this.sortViewChild()!;
    this.dataSource.filterPredicate = (data: GroupDataset, filter: string) => {
      const f = filter.toLowerCase();
      return data.groupName.toLowerCase().includes(f);
    };

    const sort = this.sortViewChild();
    if (sort && this.sortSignal()) {
      setTimeout(() => {
        sort.sort({
          id: this.sortSignal()!,
          start: this.ascSignal() ? 'asc' : 'desc',
          disableClear: false,
        });
      });
    }
  }

  getList() {
    this.groupDatasetService.getAllGroupDataset().subscribe(res => {
      this.dataSource.data = res;
    });
  }

  onAdd() {
    this.router.navigate(['group-dataset-edit']);
  }

  onDelete(e: GroupDataset) {
    this.messageBoxService
      .openI18N('msg.sureDeleteDataset')
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.groupDatasetService
            .deleteGroupDataset(e.groupName)
            .subscribe(() => {
              this.snackbarService.openI18N('msg.deleteSuccess');
              this.getList();
            });
        }
      });
  }

  onEdit(e: GroupDataset) {
    this.router.navigate(['group-dataset-edit', e.groupName]);
  }

  onCopy(e: GroupDataset) {
    this.matDialog
      .open(CopyGroupDatasetComponent, {
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

  onEditDatasetData(e: GroupDataset) {
    this.matDialog.open(EditGroupDatasetDataComponent, {
      data: {
        groupName: e.groupName,
        primeValue: '',
      },
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  onImportExport(e: GroupDataset) {
    this.matDialog.open(GroupDatasetImportExportComponent, {
      data: {
        groupName: e.groupName,
        byKey: e.config.byKey,
      },
      width: '480px',
      autoFocus: false,
    });
  }

  onRefresh(element: GroupDataset) {
    this.groupDatasetService
      .refreshGroupDataset(element.groupName)
      .subscribe(() => {});
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value);
    this.dataSource.filter = value.trim().toLowerCase();
    this.updateQueryParams();
  }

  clearFilter() {
    this.filterValue.set('');
    this.dataSource.filter = '';
    this.updateQueryParams();
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

  updateQueryParams() {
    const queryParams: any = {};

    if (this.sortSignal()) {
      queryParams['sort'] = this.sortSignal();
      queryParams['asc'] = this.ascSignal();
    }

    if (this.filterValue() !== null && this.filterValue() !== undefined) {
      queryParams['filter'] = this.filterValue();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : null,
      queryParamsHandling: 'merge',
    });
  }
}
