import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChildren,
} from '@angular/core';
import {
  disabled,
  form,
  FormField,
  validateTree,
} from '@angular/forms/signals';

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
import { SignalFieldType } from '../../../../core/model/signal-field.model';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { SpiderConfigService } from '../../../spider/services/spider-config.service';
import { SpiderService } from '../../../spider/services/spider.service';
import {
  GroupDatasetConfig,
  GroupDatasetData,
  GroupDatasetFieldType,
  GroupDatasetSpider,
} from '../../model';
import { GroupDatasetDataService } from '../../service/group-dataset-data.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { JsonDataFieldComponent } from '../json-data-field/json-data-field.component';
import { parseGroupDatasetNumber } from '../../util/group-dataset-field-value';

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
    JsonDataFieldComponent,
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
  readonly fieldType = SignalFieldType;
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
  readonly jsonForm = form(this.jsonModel, p => {
    validateTree(p, ({ value, fieldTree }) =>
      (this.groupDatasetConfig()?.groupDatasetFieldList ?? [])
        .filter(
          field =>
            field.type === GroupDatasetFieldType.number &&
            parseGroupDatasetNumber(value()[field.key]) === undefined
        )
        .map(field => ({
          kind: field.type,
          message: 'dataset.validNumberRequired',
          fieldTree: fieldTree[field.key],
        }))
    );
  });
  readonly jsonEditors = viewChildren(JsonDataFieldComponent);
  readonly jsonEditorReset = signal(0);
  readonly hasInvalidJson = computed(() =>
    this.jsonEditors().some(editor => editor.invalid())
  );
  get json() {
    return this.jsonModel();
  }
  set json(value: Record<string, any>) {
    const defaults = Object.fromEntries(
      (this.groupDatasetConfig()?.groupDatasetFieldList ?? [])
        .filter(
          field =>
            field.type === GroupDatasetFieldType.jsonObject ||
            field.type === GroupDatasetFieldType.jsonArray ||
            field.type === GroupDatasetFieldType.number ||
            field.type === GroupDatasetFieldType.date
        )
        .map(field => [field.key, this.defaultFieldValue(field.type)])
    );
    this.jsonModel.set({ ...defaults, ...value });
  }
  readonly spiderInputModel = signal<{
    [key in string]: { url: string; primeKeyList: string[] };
  }>({});
  readonly spiderInputForm = form(this.spiderInputModel);
  get spiderInput() {
    return this.spiderInputModel();
  }
  set spiderInput(value: {
    [key in string]: { url: string; primeKeyList: string[] };
  }) {
    this.spiderInputModel.set(value);
  }

  private readonly snackbarService = inject(SnackbarService);
  private readonly groupDatasetDataService = inject(GroupDatasetDataService);
  private readonly groupDatasetService = inject(GroupDatasetService);
  private readonly spiderConfigService = inject(SpiderConfigService);
  private readonly spiderService = inject(SpiderService);
  private readonly selectTableService = inject(SelectTableService);
  private readonly messageBoxService = inject(MessageBoxService);
  private readonly translateService = inject(TranslateService);
  ngOnInit(): void {
    this.groupDatasetService.getGroupDataset(this.groupName).subscribe(res => {
      this.groupDatasetConfig.set(res.config);
      this.clearField();
      this.getSpiderList();
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
        this.jsonEditorReset.update(value => value + 1);
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

  getSpiderList() {
    const config = this.groupDatasetConfig();
    if (!config) {
      return;
    }
    const spiderIds = new Set(
      config.groupDatasetSpiderList
        .filter(row => row.visibleJson || row.visibleUrl)
        .map(row => row.spiderId)
    );
    if (spiderIds.size === 0) return;
    this.spiderConfigService.getAll().subscribe(configs => {
      this.spiderInput = Object.fromEntries(
        configs
          .filter(config => spiderIds.has(config.spiderId))
          .map(config => [
            config.spiderId,
            {
              url: '',
              primeKeyList: Array.from(
                { length: config.primeKeySize },
                () => ''
              ),
            },
          ])
      );
    });
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
          this.jsonEditorReset.update(value => value + 1);
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
    if (this.hasInvalidJson()) {
      this.snackbarService.openI18N('msg.invalidJson');
      return;
    }
    if (this.jsonForm().invalid()) {
      this.jsonForm().markAsTouched();
      this.snackbarService.openI18N('msg.formInvalid');
      return;
    }
    const json = { ...this.json };
    for (const field of config.groupDatasetFieldList) {
      if (field.type === GroupDatasetFieldType.number)
        json[field.key] = parseGroupDatasetNumber(json[field.key]);
    }
    var req: GroupDatasetData = {
      groupName: this.groupName,
      primeValue: json[config.byKey],
      json,
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

  spiderByUrl(spider: GroupDatasetSpider) {
    if (isBlank(this.spiderInput[spider.spiderId].url)) {
      this.snackbarService.isBlankMessage(
        this.translateService.instant('dataset.spiderUrlLabel', {
          label: spider.label,
        })
      );
      return;
    }
    this.spiderService
      .executeByUrl({
        spiderId: spider.spiderId,
        url: this.spiderInput[spider.spiderId].url,
      })
      .subscribe(res => {
        this.json = { ...this.json, ...res };
      });
  }

  spiderByPrimeKey(spiderId: string, primeKeyList: string[]) {
    this.spiderService
      .executeByPrimeKeyList({ spiderId, primeKeyList })
      .subscribe(res => {
        this.json = { ...this.json, ...res };
      });
  }

  clearField() {
    const config = this.groupDatasetConfig();
    if (!config) {
      return;
    }
    this.json = {
      ...this.json,
      ...Object.fromEntries(
        config.groupDatasetFieldList.map(field => [
          field.key,
          this.defaultFieldValue(field.type),
        ])
      ),
    };
    this.jsonEditorReset.update(value => value + 1);
  }

  onJsonFieldChange(key: string, value: unknown) {
    this.jsonModel.update(json => ({ ...json, [key]: value }));
  }

  private defaultFieldValue(type: GroupDatasetFieldType): unknown {
    switch (type) {
      case GroupDatasetFieldType.number:
        return 0;
      case GroupDatasetFieldType.jsonObject:
        return {};
      case GroupDatasetFieldType.jsonArray:
      case GroupDatasetFieldType.stringArray:
        return [];
      default:
        return '';
    }
  }
}
