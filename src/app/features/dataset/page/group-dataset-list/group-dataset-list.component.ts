import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GroupDataset } from '../../model';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DatasetService } from '../../service/dataset.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { MessageBoxComponent } from '../../../../core/components/message-box/message-box.component';
import { isNotBlank } from '../../../../shared/util/helper';
import { CopyDatasetComponent } from '../../components/copy-dataset/copy-dataset.component';
import { CopyGroupDatasetComponent } from '../../components/copy-group-dataset/copy-group-dataset.component';
import { EditGroupDatasetDataComponent } from '../../components/edit-group-dataset-data/edit-group-dataset-data.component';
import { GroupDatasetImportExportComponent } from '../../components/group-dataset-import-export/group-dataset-import-export.component';
import { MatSort, MatSortModule } from '@angular/material/sort';

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
  ],
  templateUrl: './group-dataset-list.component.html',
  styleUrl: './group-dataset-list.component.scss',
})
export class GroupDatasetListComponent implements OnInit, AfterViewInit {
  displayedColumns = ['groupName', 'createdTime', 'updatedTime', 'other'];
  dataSource = new MatTableDataSource<GroupDataset>([]);

  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private translateService: TranslateService,
    private matDialog: MatDialog,
    private router: Router,
    private snackbarService: SnackbarService,
    private groupDatasetService: GroupDatasetService
  ) {}

  ngOnInit() {
    this.getList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
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
    this.matDialog
      .open(MessageBoxComponent, {
        data: {
          message: this.translateService.instant('msg.sureDeleteDataset'),
        },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.groupDatasetService
            .deleteGroupDataset(e.groupName)
            .subscribe(() => {
              this.snackbarService.openByI18N('msg.deleteSuccess');
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
          this.snackbarService.openByI18N('msg.copySuccess');
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
}
