import { Component, inject, OnInit, signal } from '@angular/core';
import { disabled, form, FormField } from '@angular/forms/signals';

import {
  MatChipEditedEvent,
  MatChipInputEvent,
  MatChipsModule,
} from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EMPTY, filter, switchMap, tap } from 'rxjs';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { ScrapyService } from '../../../spider/services/scrapy.service';
import {
  GroupDatasetConfig,
  GroupDatasetData,
  GroupDatasetScrapy,
} from '../../model';
import { GroupDatasetDataService } from '../../service/group-dataset-data.service';
import { GroupDatasetService } from '../../service/group-dataset.service';

export interface EditGroupDatasetDataType {
  groupName: string;
  primeValue: string;
}
let nextEditorId = 0;

@Component({
  selector: 'app-edit-group-dataset-data',

  imports: [
    FormField,
    SignalFieldComponent,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslatePipe,
    MatIconModule,
    MatChipsModule,
    TrimOnBlurDirective,
  ],
  templateUrl: './edit-group-dataset-data.component.html',
  styleUrl: './edit-group-dataset-data.component.scss',
})
export class EditGroupDatasetDataComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<EditGroupDatasetDataComponent>);
  readonly data = inject<EditGroupDatasetDataType>(MAT_DIALOG_DATA);
  readonly controlId = `group-data-${++nextEditorId}`;
  readonly groupNameModel = signal(this.data.groupName);
  readonly groupNameForm = form(this.groupNameModel, p => disabled(p));
  get groupName() {
    return this.groupNameModel();
  }
  set groupName(value) {
    this.groupNameModel.set(value);
  }
  readonly primeValueModel = signal(this.data.primeValue);
  readonly primeValueForm = form(this.primeValueModel);
  get primeValue() {
    return this.primeValueModel();
  }
  set primeValue(value) {
    this.primeValueModel.set(value);
  }
  readonly groupDatasetConfig = signal<GroupDatasetConfig | undefined>(
    undefined
  );
  readonly jsonModel = signal<Record<string, any>>({});
  readonly jsonForm = form(this.jsonModel);
  get json() {
    return this.jsonModel();
  }
  set json(value: Record<string, any>) {
    this.jsonModel.set(value);
  }
  readonly scrapyInputModel = signal<{
    [key in string]: { url: string; json: string[] };
  }>({});
  readonly scrapyInputForm = form(this.scrapyInputModel);
  get scrapyInput() {
    return this.scrapyInputModel();
  }
  set scrapyInput(value: { [key in string]: { url: string; json: string[] } }) {
    this.scrapyInputModel.set(value);
  }

  private readonly snackbarService = inject(SnackbarService);
  private readonly groupDatasetDataService = inject(GroupDatasetDataService);
  private readonly groupDatasetService = inject(GroupDatasetService);
  private readonly scrapyService = inject(ScrapyService);
  private readonly selectTableService = inject(SelectTableService);
  private readonly messageBoxService = inject(MessageBoxService);
  private readonly translateService = inject(TranslateService);
  ngOnInit(): void {
    this.groupDatasetService.getGroupDataset(this.groupName).subscribe(res => {
      this.groupDatasetConfig.set(res.config);
      for (var field of res.config.groupDatasetFieldList) {
        if (field.type === 'string') {
          this.json = { ...this.json, [field.key]: '' };
        } else if (field.type === 'stringArray') {
          this.json = { ...this.json, [field.key]: [] };
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
    const config = this.groupDatasetConfig();
    if (!config) {
      return;
    }
    var nameList = config.groupDatasetScrapyList
      .filter(x => x.visibleJson || x.visibleUrl)
      .map(x => x.name);
    if (nameList && nameList.length > 0) {
      this.scrapyService.getByNameList(nameList).subscribe(res => {
        for (var x of res) {
          this.scrapyInput = {
            ...this.scrapyInput,
            [x.name]: {
              url: '',
              json: Array.from({ length: x.paramSize }, () => ''),
            },
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
    this.json = { ...this.json };
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
    this.json = { ...this.json };
  }

  removeChip(value: string, key: string) {
    this.json[key] = this.json[key].filter((x: string) => x !== value);
    this.json = { ...this.json };
  }

  onUpdate(): void {
    const config = this.groupDatasetConfig();
    if (!config) {
      return;
    }
    var req: GroupDatasetData = {
      groupName: this.groupName,
      primeValue: this.json[config.byKey],
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
    const config = this.groupDatasetConfig();
    if (!config) {
      return;
    }
    for (var field of config.groupDatasetFieldList) {
      if (field.type === 'string') {
        this.json = { ...this.json, [field.key]: '' };
      } else if (field.type === 'stringArray') {
        this.json = { ...this.json, [field.key]: [] };
      }
    }
  }
}
