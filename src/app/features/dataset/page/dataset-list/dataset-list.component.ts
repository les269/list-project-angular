import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MessageBoxComponent } from '../../../../core/components/message-box/message-box.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { Dataset } from '../../model/dataset.model';
import { DatasetService } from '../../service/dataset.service';
import { CopyDatasetComponent } from '../../components/copy-dataset/copy-dataset.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditGroupDatasetDataComponent } from '../../components/edit-group-dataset-data/edit-group-dataset-data.component';
import { MatSort, MatSortModule } from '@angular/material/sort';

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
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private translateService: TranslateService,
    private matDialog: MatDialog,
    private router: Router,
    private snackbarService: SnackbarService,
    private datasetService: DatasetService
  ) {}

  ngOnInit() {
    this.getList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
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
    this.matDialog
      .open(MessageBoxComponent, {
        data: {
          message: this.translateService.instant('msg.sureDeleteDataset'),
        },
      })
      .afterClosed()
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
}
