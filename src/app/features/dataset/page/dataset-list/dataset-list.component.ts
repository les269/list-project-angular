import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
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
  isRefreshing: boolean = false;
  filterValue: string = '';
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private matDialog: MatDialog,
    private router: Router,
    private snackbarService: SnackbarService,
    private datasetService: DatasetService,
    private messageBoxService: MessageBoxService
  ) {}

  ngOnInit() {
    this.getList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
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
  }

  getList() {
    this.datasetService.getAllDataset().subscribe(res => {
      this.dataSource.data = res;
    });
  }

  onAdd() {
    this.router.navigate(['dataset-edit']);
  }
  onDelete(e: Dataset) {
    this.messageBoxService
      .openI18N('msg.sureDeleteDataset')
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.datasetService.deleteDataset(e.name).subscribe(() => {
            this.snackbarService.openByI18N('msg.deleteSuccess');
            this.getList();
          });
        }
      });
  }
  onEdit(e: Dataset) {
    this.router.navigate(['dataset-edit', e.name]);
  }
  onCopy(e: Dataset) {
    this.matDialog
      .open(CopyDatasetComponent, {
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
  onRefresh(e: Dataset) {
    if (this.isRefreshing) {
      return;
    }
    this.isRefreshing = true;
    this.datasetService.refreshData(e.name).subscribe(
      x => {
        this.snackbarService.openByI18N('msg.refreshSuccess');
      },
      e => {
        this.isRefreshing = false;
      },
      () => {
        this.isRefreshing = false;
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
    this.filterValue = filterValue;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  clearFilter() {
    this.filterValue = '';
    this.dataSource.filter = '';
  }
}
