import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
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
  ],
  templateUrl: './dataset-list.component.html',
})
export class DatasetListComponent {
  displayedColumns = [
    'name',
    'filterType',
    'groupName',
    'createdTime',
    'updatedTime',
    'other',
  ];
  list: Dataset[] = [];
  isRefreshing: boolean = false;
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
  getList() {
    this.datasetService.getAllDataset().subscribe(res => {
      this.list = res;
    });
  }
  onAdd() {
    this.router.navigate(['dataset-edit']);
  }
  onDelete(index: number) {
    this.matDialog
      .open(MessageBoxComponent, {
        data: {
          message: this.translateService.instant('msg.sureDeleteDataset'),
        },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.datasetService
            .deleteDataset(this.list[index].name)
            .subscribe(() => {
              this.snackbarService.openByI18N('msg.deletSuccess');
              this.getList();
            });
        }
      });
  }
  onEdit(index: number) {
    this.router.navigate(['dataset-edit', this.list[index].name]);
  }
  onCopy(index: number) {
    this.matDialog
      .open(CopyDatasetComponent, {
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
  onRefresh(index: number) {
    if (this.isRefreshing) {
      return;
    }
    this.isRefreshing = true;
    this.datasetService.refreshData(this.list[index].name).subscribe(
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
