import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { TranslateModule } from '@ngx-translate/core';
import { GroupDatasetConfig, GroupDatasetData } from '../../model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { GroupDatasetDataService } from '../../service/group-dataset-data.service';
import { ScrapyService } from '../../../scrapy/services/scrapy.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { MatIconModule } from '@angular/material/icon';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { switchMap } from 'rxjs';
import {
  MatChipEditedEvent,
  MatChipInputEvent,
  MatChipsModule,
} from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';

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
    CommonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
  ],
  templateUrl: './edit-group-dataset-data.component.html',
  styleUrl: './edit-group-dataset-data.component.scss',
})
export class EditGroupDatasetDataComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<EditGroupDatasetDataComponent>);
  readonly data = inject<EditGroupDatasetDataType>(MAT_DIALOG_DATA);
  groupName = this.data.groupName;
  primeValue = this.data.primeValue;
  groupDatasetConfig!: GroupDatasetConfig;
  json: any = {};
  scrapySize: { [key in string]: number } = {};

  constructor(
    private snackbarService: SnackbarService,
    private groupDatasetDataService: GroupDatasetDataService,
    private groupDatasetService: GroupDatasetService,
    private scrapyService: ScrapyService,
    private selectTableService: SelectTableService
  ) {}
  ngOnInit(): void {
    this.groupDatasetService.getGroupDataset(this.groupName).subscribe(res => {
      this.groupDatasetConfig = res.config;
      for (var field of res.config.groupDatasetFieldList) {
        this.json[field.key] = '';
      }
      this.getScrapyList();
      this.searchByPrimeValue();
    });
  }

  searchByPrimeValue() {
    if (isNotBlank(this.primeValue)) {
      this.groupDatasetDataService
        .getGroupDatasetData(this.groupName, this.primeValue)
        .subscribe(res => {
          this.json = res.json;
        });
    }
  }

  getScrapyList() {
    var nameList = this.groupDatasetConfig.groupDatasetScrapyList
      .filter(x => x.visibleJson)
      .map(x => x.name);
    if (nameList && nameList.length > 0) {
      this.scrapyService.getByNameList(nameList).subscribe(res => {
        for (var x of res) {
          this.scrapySize[x.name] = x.paramSize;
        }
      });
    }
  }

  selectPrimeValue() {
    this.groupDatasetDataService
      .getAllGroupDatasetData(this.groupName)
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
      this.snackbarService.openByI18N('msg.updateSuccess');
    });
  }
}
