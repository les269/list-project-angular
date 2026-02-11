import { Component, inject, OnInit } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  GroupDatasetConfig,
  GroupDatasetData,
  GroupDatasetScrapy,
} from '../../model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { GroupDatasetDataService } from '../../service/group-dataset-data.service';
import { ScrapyService } from '../../../scrapy/services/scrapy.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { MatIconModule } from '@angular/material/icon';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { EMPTY, filter, switchMap, tap } from 'rxjs';
import {
  MatChipEditedEvent,
  MatChipInputEvent,
  MatChipsModule,
} from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MessageBoxService } from '../../../../core/services/message-box.service';

export interface EditGroupDatasetDataType {
  groupName: string;
  primeValue: string;
}
@Component({
  selector: 'app-edit-group-dataset-data',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
  ],
  templateUrl: './edit-group-dataset-data.component.html',
})
export class EditGroupDatasetDataComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<EditGroupDatasetDataComponent>);
  readonly data = inject<EditGroupDatasetDataType>(MAT_DIALOG_DATA);
  groupName = this.data.groupName;
  primeValue = this.data.primeValue;
  groupDatasetConfig!: GroupDatasetConfig;
  json: any = {};
  scrapySize: { [key in string]: number } = {};
  scrapyInput: { [key in string]: { url: string; json: string[] } } = {};

  constructor(
    private snackbarService: SnackbarService,
    private groupDatasetDataService: GroupDatasetDataService,
    private groupDatasetService: GroupDatasetService,
    private scrapyService: ScrapyService,
    private selectTableService: SelectTableService,
    private messageBoxService: MessageBoxService,
    private translateService: TranslateService
  ) {}
  ngOnInit(): void {
    this.groupDatasetService.getGroupDataset(this.groupName).subscribe(res => {
      this.groupDatasetConfig = res.config;
      for (var field of res.config.groupDatasetFieldList) {
        if (field.type === 'string') {
          this.json[field.key] = '';
        } else if (field.type === 'stringArray') {
          this.json[field.key] = [];
        }
      }
      this.getScrapyList();
      if (isNotBlank(this.primeValue)) {
        this.searchByPrimeValue();
      }
    });
  }

  searchByPrimeValue() {
    if (isBlank(this.primeValue)) {
      this.snackbarService.isBlankMessage('dataset.primeValue');
      return;
    }
    this.groupDatasetDataService
      .existGroupDatasetData(this.groupName, this.primeValue)
      .pipe(
        tap(x => {
          if (!x) {
            this.snackbarService.openI18N('msg.dataNotExist');
          }
        }),
        filter(x => x),
        switchMap(x =>
          this.groupDatasetDataService.getGroupDatasetData(
            this.groupName,
            this.primeValue
          )
        )
      )
      .subscribe(res => {
        this.json = { ...this.json, ...res.json };
      });
  }

  deleteByPrimeValue() {
    if (isBlank(this.primeValue)) {
      this.snackbarService.isBlankMessage('dataset.primeValue');
      return;
    }
    this.messageBoxService
      .openI18N('msg.sureDeleteDatasetData', {
        params: { name: this.primeValue },
      })
      .pipe(
        filter(x => isNotBlank(x)),
        switchMap(x =>
          this.groupDatasetDataService.existGroupDatasetData(
            this.groupName,
            this.primeValue
          )
        ),
        filter(x => x),
        switchMap(x =>
          this.groupDatasetDataService.deleteGroupDatasetData(
            this.groupName,
            this.primeValue
          )
        )
      )
      .subscribe(() => {
        this.primeValue = '';
        this.clearField();
      });
  }

  getScrapyList() {
    var nameList = this.groupDatasetConfig.groupDatasetScrapyList
      .filter(x => x.visibleJson || x.visibleUrl)
      .map(x => x.name);
    if (nameList && nameList.length > 0) {
      this.scrapyService.getByNameList(nameList).subscribe(res => {
        for (var x of res) {
          this.scrapySize[x.name] = x.paramSize;
          this.scrapyInput[x.name] = {
            url: '',
            json: [].constructor(x.paramSize).map(() => ''),
          };
        }
      });
    }
  }

  selectPrimeValue() {
    this.groupDatasetDataService
      .getAllGroupDatasetDataOnlyPrimeValue(this.groupName)
      .pipe(
        switchMap(res =>
          this.selectTableService.selectSingleGroupDatasetData(res)
        )
      )
      .subscribe(res => {
        if (res) {
          this.primeValue = res.primeValue;
          this.json = res.json;
        }
      });
  }

  addChip(event: MatChipInputEvent, key: string) {
    const value = (event.value || '').trim();
    if (value) {
      this.json[key] = [...this.json[key], value]
        .filter((value, i, arr) => arr.indexOf(value) === i)
        .sort((a, b) => (a > b ? 1 : -1));
    }
    this.json = this.json;
    event.chipInput!.clear();
  }

  editChip(before: string, key: string, event: MatChipEditedEvent) {
    const after = event.value.trim();
    if (before === after) {
      return;
    }
    this.json[key] = [...this.json[key], after]
      .filter(x => x !== before)
      .sort((a, b) => (a > b ? 1 : -1));
    this.json = this.json;
  }

  removeChip(value: string, key: string) {
    this.json[key] = this.json[key].filter((x: string) => x !== value);
    this.json = this.json;
  }

  onUpdate(): void {
    var req: GroupDatasetData = {
      groupName: this.groupName,
      primeValue: this.json[this.groupDatasetConfig.byKey],
      json: this.json,
    };
    this.groupDatasetDataService.updateGroupDatasetData(req).subscribe(() => {
      this.snackbarService.openI18N('msg.updateSuccess');
    });
  }

  deleteImage() {
    if (isBlank(this.primeValue)) {
      this.snackbarService.isBlankMessage('dataset.primeValue');
      return;
    }
    this.messageBoxService
      .openI18N('msg.sureDeleteImage', { params: { name: this.primeValue } })
      .pipe(
        switchMap(x => {
          if (x) {
            return this.groupDatasetDataService.deleteGroupDatasetDataForImage(
              this.groupName,
              this.primeValue
            );
          }
          return EMPTY;
        })
      )
      .subscribe(res => {
        if (isBlank(res)) {
          this.snackbarService.openI18N('msg.deleteImageFail');
        } else {
          this.snackbarService.openI18N('msg.deleteImageSuccess', {
            path: res,
          });
        }
      });
  }

  scrapyByUrl(scrapy: GroupDatasetScrapy) {
    if (isBlank(this.scrapyInput[scrapy.name].url)) {
      this.snackbarService.isBlankMessage(
        this.translateService.instant('dataset.scrapyUrlLabel', {
          label: scrapy.label,
        })
      );
      return;
    }
    this.scrapyService
      .scrapyByUrl({
        scrapyName: scrapy.name,
        url: this.scrapyInput[scrapy.name].url,
      })
      .subscribe(res => {
        this.json = { ...this.json, ...res };
      });
  }

  scrapyByJson(scrapyName: string, json: string[]) {
    this.scrapyService.scrapyByJson({ scrapyName, json }).subscribe(res => {
      this.json = { ...this.json, ...res };
    });
  }

  clearField() {
    for (var field of this.groupDatasetConfig.groupDatasetFieldList) {
      if (field.type === 'string') {
        this.json[field.key] = '';
      } else if (field.type === 'stringArray') {
        this.json[field.key] = [];
      }
    }
  }
}
