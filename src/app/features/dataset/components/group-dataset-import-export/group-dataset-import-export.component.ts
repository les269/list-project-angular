import { Component, ElementRef, inject, ViewChild } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import {
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GroupDatasetDataService } from '../../service/group-dataset-data.service';
import { EMPTY, filter, map, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import {
  downloadJsonFile,
  isNotBlank,
  readJsonFile,
} from '../../../../shared/util/helper';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { GroupDatasetData } from '../../model';

@Component({
  selector: 'app-group-dataset-import-export',
  standalone: true,
  imports: [
    TranslateModule,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './group-dataset-import-export.component.html',
})
export class GroupDatasetImportExportComponent {
  readonly dialogRef = inject(MatDialogRef<GroupDatasetImportExportComponent>);
  readonly data = inject<{ groupName: string; byKey: string }>(MAT_DIALOG_DATA);
  groupName = this.data.groupName;
  byKey: string = this.data.byKey;
  @ViewChild('importJsonInput') importJsonInput!: ElementRef<HTMLInputElement>;

  constructor(
    private groupDatasetDataService: GroupDatasetDataService,
    private snackbarService: SnackbarService,
    private messageBoxService: MessageBoxService
  ) {}

  export(onlyJson?: boolean) {
    const currentTime = new Date().toISOString().replace(/[:.]/g, '-'); // 例如: 2024-11-17T12-34-56-789Z
    const fileName = `${this.groupName}_${currentTime}.json`;
    this.groupDatasetDataService
      .getAllGroupDatasetData(this.groupName)
      .pipe(filter(x => x !== undefined))
      .subscribe(data => {
        if (onlyJson) {
          data = data.map(x => x.json);
        }

        const jsonData = JSON.stringify(data, null, 2); // 轉換成格式化的 JSON 字串
        downloadJsonFile(jsonData, fileName);
      });
  }

  import(event: Event, onlyJson?: boolean) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const reader = new FileReader();
      readJsonFile(reader)
        .pipe(
          map(data =>
            this.handleJsonData(
              data as any[],
              onlyJson ?? false,
              this.byKey,
              this.groupName
            )
          ),
          switchMap(req => {
            if (req.length === 0) {
              this.snackbarService.openI18N('msg.importError');
              return EMPTY;
            } // 中斷流程，如果資料不正確
            return this.messageBoxService
              .openI18N('msg.importNum', { params: { number: req.length } })
              .pipe(
                filter(confirmation => isNotBlank(confirmation)),
                switchMap(() =>
                  this.groupDatasetDataService.updateGroupDatasetDataList(req)
                )
              );
          })
        )
        .subscribe(x => {
          this.snackbarService.openI18N('msg.importSuccess');
        });
      reader.readAsText(input.files[0]);
      input.value = '';
    }
  }

  private handleJsonData(
    data: any[],
    onlyJson: boolean,
    key: string,
    groupName: string
  ): GroupDatasetData[] {
    if (onlyJson) {
      return data
        .map(json => ({
          groupName,
          primeValue: json[key],
          json,
        }))
        .filter(item => isNotBlank(item.primeValue));
    } else {
      const isValidFormat = data.every(
        item =>
          item.hasOwnProperty('groupName') &&
          item.hasOwnProperty('primeValue') &&
          item.hasOwnProperty('json')
      );
      if (!isValidFormat) {
        this.snackbarService.openI18N('msg.importError');
        return [];
      }
      return data.map(item => ({
        ...item,
        groupName,
      }));
    }
  }
}
