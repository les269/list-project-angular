import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  Input,
  linkedSignal,
  Output,
  ResourceRef,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  CookieListMapType,
  ExtractionRule,
  ExtractionRuleMode,
  ExtractionStepCondition,
  SpiderItem,
  SpiderItemMode,
  SpiderItemSetting,
  SpiderMapping,
  UrlType,
} from '../../model';
import {
  ControlsOf,
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
  ToFormArray,
} from '../../../../core/model';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { PipelineListComponent } from '../pipeline-list/pipeline-list.component';
import {
  isBlank,
  isNotBlank,
  toKeyValueArray,
} from '../../../../shared/util/helper';
import { MatCheckbox } from '@angular/material/checkbox';
import { SpiderItemService } from '../../services/spider-item.service';
import { EMPTY, switchMap } from 'rxjs';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SpiderMappingService } from '../../services/spider-mapping.service';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { CookieListService } from '../../services/cookie-list.service';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { SpiderService } from '../../services/spider.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpiderFormService } from '../../services/spider-form.service';
import { MatDialog, MatDialogClose } from '@angular/material/dialog';
import {
  CookieTableDialogComponent,
  CookieTableDialogData,
} from '../cookie-table-dialog/cookie-table-dialog.component';

@Component({
  selector: 'app-spider-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    GenericTableComponent,
    MatCheckbox,
    CodeEditor,
    PipelineListComponent,
    TrimOnBlurDirective,
    MatTooltipModule,
  ],
  templateUrl: './spider-item.component.html',
})
export class SpiderItemComponent {
  // inject
  readonly fb = inject(FormBuilder);
  readonly translateService = inject(TranslateService);
  readonly spiderItemService = inject(SpiderItemService);
  readonly spiderMappingService = inject(SpiderMappingService);
  readonly snackbarService = inject(SnackbarService);
  readonly selectTableService = inject(SelectTableService);
  readonly messageBoxService = inject(MessageBoxService);
  readonly cookieListService = inject(CookieListService);
  readonly spiderService = inject(SpiderService);
  readonly spiderFormService = inject(SpiderFormService);
  readonly matDialog = inject(MatDialog);
  // input
  readonly initData = input<SpiderItem>();
  readonly index = input<number>();

  readonly mappingsRx = input<ResourceRef<SpiderMapping[]>>();
  readonly spiderId = input<string>();
  //signal
  readonly extractionRuleListData = linkedSignal(
    () => this.initData()?.itemSetting.extractionRuleList ?? []
  );
  readonly mappings = computed(() => this.mappingsRx()?.value() ?? []);
  readonly itemMode = signal<SpiderItemMode>(SpiderItemMode.create);
  readonly isCreateMode = computed(
    () => this.itemMode() === SpiderItemMode.create
  );
  readonly isEditMode = computed(() => this.itemMode() === SpiderItemMode.edit);
  readonly isBinding = computed(() => {
    return (
      this.isEditMode() &&
      this.mappings()?.find(m => m.spiderItemId === this.spiderItemId.value)
    );
  });
  readonly hasSpiderId = computed(() => isNotBlank(this.spiderId()));
  readonly cookieRefId = computed(() => {
    if (this.itemMode() === SpiderItemMode.edit) {
      return this.spiderItemId.getRawValue();
    }
    return '';
  });

  // form
  readonly form = this.fb.nonNullable.group({
    spiderItemId: ['', [Validators.required]],
    description: [''],
    itemSetting: this.fb.nonNullable.group({
      url: [''],
      urlType: [UrlType.BY_PRIME_KEY],
      testData: this.fb.nonNullable.group({
        html: [''],
        json: [''],
        resultJson: [''],
      }),
      mode: [ExtractionRuleMode.SELECT],
      extractionRuleList: this.fb.nonNullable.array<
        FormGroup<ControlsOf<ExtractionRule>>
      >([]),
      skipWhenUsingUrl: [false],
    }),
  });
  // constants
  readonly eUrlType = UrlType;
  readonly CodeEditorLanguages = languages;
  readonly eExtractionRuleMode = ExtractionRuleMode;
  readonly eExtractionStepCondition = ExtractionStepCondition;
  readonly eCookieListMapType = CookieListMapType;
  readonly selectorDisplayedColumns = ['key', 'selector'];
  readonly jsonPathDisplayedColumns = ['key', 'jsonPath'];
  readonly cols: GenericTableColumn[] = [
    {
      key: 'key',
      label: 'spider.key',
      columnType: GenericColumnType.input,
    },
    {
      key: 'selector',
      label: 'spider.selector',
      columnType: GenericColumnType.textarea,
      width: '70%',
    },
    {
      key: 'jsonPath',
      label: 'spider.jsonPath',
      columnType: GenericColumnType.textarea,
      width: '70%',
    },
  ];

  get spiderItemId() {
    return this.form.controls.spiderItemId;
  }

  get description() {
    return this.form.controls.description;
  }
  get url() {
    return this.form.controls.itemSetting.controls.url;
  }
  get urlType() {
    return this.form.controls.itemSetting.controls.urlType;
  }
  get htmlData() {
    return this.form.controls.itemSetting.controls.testData.controls.html!;
  }

  get jsonData() {
    return this.form.controls.itemSetting.controls.testData.controls.json!;
  }
  get resultJsonData() {
    return this.form.controls.itemSetting.controls.testData.controls
      .resultJson!;
  }

  get extractionRuleMode() {
    return this.form.controls.itemSetting.controls.mode;
  }

  get extractionRuleList() {
    return this.form.controls.itemSetting.controls.extractionRuleList;
  }
  get skipWhenUsingUrl() {
    return this.form.controls.itemSetting.controls.skipWhenUsingUrl;
  }
  get modeParams() {
    return this.urlType.value === UrlType.BY_PARAMS;
  }
  get modePrimeKey() {
    return this.urlType.value === UrlType.BY_PRIME_KEY;
  }
  get useJsonPath() {
    return this.extractionRuleMode.value === ExtractionRuleMode.JSON_PATH;
  }
  get useSelector() {
    return this.extractionRuleMode.value === ExtractionRuleMode.SELECT;
  }

  get createExtractionRule() {
    return this.spiderFormService.createExtractionRule;
  }

  constructor() {
    effect(() => {
      if (this.isEditMode()) {
        this.spiderItemId.disable({ emitEvent: false });
      } else {
        this.spiderItemId.enable({ emitEvent: false });
      }
    });
    effect(() => {
      const item = this.initData();
      if (item) {
        this.form.patchValue(item, { emitEvent: false });
        if (item.spiderItemId) {
          this.itemMode.set(SpiderItemMode.edit);
        }
      }
    });
  }

  onAddItem() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue() as SpiderItem;
    this.spiderItemService
      .getBySpiderItemId(value.spiderItemId)
      .pipe(
        switchMap(item => {
          if (item) {
            this.snackbarService.openI18N('msg.spiderItemExist');
            return EMPTY;
          }
          return this.spiderItemService.update(value);
        })
      )
      .subscribe(() => {
        this.snackbarService.openI18N('msg.addSuccess');
        this.itemMode.set(SpiderItemMode.edit);
      });
  }
  onSaveItem() {
    const value = this.form.getRawValue() as SpiderItem;
    return this.spiderItemService.update(value).subscribe(() => {
      this.snackbarService.openI18N('msg.updateSuccess');
    });
  }

  onReadItems() {
    this.spiderItemService
      .getAll()
      .pipe(
        switchMap(data => this.selectTableService.selectSingleSpiderItem(data)),
        switchMap(item =>
          this.spiderItemService.getBySpiderItemId(item.spiderItemId)
        )
      )
      .subscribe(item => {
        this.form.patchValue(item);
        this.setExtractionRuleList(item.itemSetting.extractionRuleList ?? []);
        this.itemMode.set(SpiderItemMode.edit);
      });
  }

  toggleBind() {
    const spiderId = this.spiderId();
    const executionOrder = this.index();
    const spiderItemId = this.spiderItemId.value;

    if (
      spiderId === undefined ||
      executionOrder === undefined ||
      isBlank(spiderItemId)
    ) {
      return;
    }
    if (this.isBinding()) {
      this.spiderMappingService
        .delete(spiderId, executionOrder, spiderItemId)
        .subscribe(() => {
          this.snackbarService.openI18N('msg.unbindSuccess');
          this.mappingsRx()?.reload();
        });
    } else {
      this.spiderMappingService
        .update({ spiderId, executionOrder, spiderItemId })
        .subscribe(() => {
          this.snackbarService.openI18N('msg.bindSuccess');
          this.mappingsRx()?.reload();
        });
    }
  }

  onClear() {
    this.messageBoxService.openI18N('msg.sureClear').subscribe(result => {
      if (!result) {
        return;
      }
      this.clearItem();
    });
  }

  clearItem() {
    this.itemMode.set(SpiderItemMode.create);
    this.form.reset();
    this.extractionRuleList.clear();
    this.extractionRuleListData.set([]);
  }
  //TODO: 如果有綁定就不能刪除，除非先解除綁定
  onDeleteItem() {
    const spiderItemId = this.spiderItemId.value;
    this.spiderMappingService
      .inUseBySpiderItemId(spiderItemId)
      .pipe(
        switchMap(inUse => {
          if (inUse) {
            this.snackbarService.openI18N('msg.spiderItemInUse');
            return EMPTY;
          }
          return this.messageBoxService.openI18N('msg.sureDeleteSpiderItem');
        }),
        switchMap(result => {
          if (!result) {
            return EMPTY;
          }
          return this.spiderItemService.delete(spiderItemId);
        })
      )
      .subscribe(() => {
        this.snackbarService.openI18N('msg.deleteSuccess');
        this.clearItem();
      });
  }

  onFormatJson() {
    try {
      const jsonValue = this.jsonData.value;
      if (isBlank(jsonValue)) {
        return;
      }
      const parsed = JSON.parse(jsonValue);
      const formatted = JSON.stringify(parsed, null, 2);
      this.jsonData.setValue(formatted);
    } catch (e) {
      this.snackbarService.openI18N('msg.invalidJson');
    }
  }

  onTestParseHtml() {
    this.resultJsonData.setValue(JSON.stringify('{}', null, 2));
    this.spiderService
      .previewExtraction(
        this.form.controls.itemSetting.value as SpiderItemSetting
      )
      .subscribe({
        next: result => {
          this.resultJsonData.setValue(JSON.stringify(result, null, 2));
          this.snackbarService.openI18N('msg.extractSuccess');
        },
        error: err => {
          this.snackbarService.openI18N('msg.extractFailed', {
            message: err.message || '',
          });
        },
      });
  }
  onTestParseJson() {}

  onCookiesDialog() {
    const data: CookieTableDialogData = {
      refId: this.spiderItemId.getRawValue() ?? '',
      mapType: CookieListMapType.SPIDER,
    };
    this.matDialog.open(CookieTableDialogComponent, {
      data,
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  private setExtractionRuleList(list: ExtractionRule[]) {
    const items = this.extractionRuleList;
    items.clear();
    for (const item of list) {
      const group = this.spiderFormService.createExtractionRule(item);
      group.patchValue(item);
      items.push(group);
    }
  }
  shouldShowValueInput(condition: ExtractionStepCondition): boolean {
    const valueConditions = [
      ExtractionStepCondition.CONTAINS,
      ExtractionStepCondition.NOT_CONTAINS,
      ExtractionStepCondition.EQUALS,
      ExtractionStepCondition.NOT_EQUALS,
      ExtractionStepCondition.MATCHES,
      ExtractionStepCondition.NOT_MATCHES,
    ];
    return valueConditions.includes(condition);
  }
  shouldShowIgnoreCase(condition: ExtractionStepCondition): boolean {
    const patternConditions = [
      ExtractionStepCondition.CONTAINS,
      ExtractionStepCondition.NOT_CONTAINS,
      ExtractionStepCondition.EQUALS,
      ExtractionStepCondition.NOT_EQUALS,
    ];
    return patternConditions.includes(condition);
  }
}
