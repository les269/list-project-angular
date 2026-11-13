import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  ResourceRef,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import {
  disabled,
  form,
  FormField,
  readonly,
  required,
} from '@angular/forms/signals';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { languages } from '@codemirror/language-data';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { defer, EMPTY, finalize, Observable, switchMap, take } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { hasFieldError } from '../../../../shared/util/signal-form';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import {
  CookieListMapType,
  ExtractionRule,
  ExtractionRuleMode,
  HeadersMapType,
  SpiderItem,
  SpiderItemMode,
  SpiderMapping,
  UrlType,
} from '../../model';
import { CookieListService } from '../../services/cookie-list.service';
import { SpiderItemService } from '../../services/spider-item.service';
import { SpiderMappingService } from '../../services/spider-mapping.service';
import { SpiderService } from '../../services/spider.service';
import { ExtractionRuleFormService } from '../../services/extraction-rule-form.service';
import {
  CookieTableDialogComponent,
  CookieTableDialogData,
} from '../cookie-table-dialog/cookie-table-dialog.component';
import {
  HeadersTableDialogComponent,
  HeadersTableDialogData,
} from '../headers-table-dialog/headers-table-dialog.component';
import { ExtractionRulesComponent } from '../extraction-rules/extraction-rules.component';

import { applyExtractionRulesSchema } from '../../schema/extraction-rules.schema';

@Component({
  selector: 'app-spider-item',

  imports: [
    CommonModule,
    TranslatePipe,
    FormField,
    MatCheckbox,
    SignalCodeEditorComponent,
    ExtractionRulesComponent,
    TrimOnBlurDirective,
  ],
  templateUrl: './spider-item.component.html',
})
export class SpiderItemComponent {
  readonly hasError = hasFieldError;
  // inject
  readonly translateService = inject(TranslateService);
  readonly spiderItemService = inject(SpiderItemService);
  readonly spiderMappingService = inject(SpiderMappingService);
  readonly snackbarService = inject(SnackbarService);
  readonly selectTableService = inject(SelectTableService);
  readonly messageBoxService = inject(MessageBoxService);
  readonly cookieListService = inject(CookieListService);
  readonly spiderService = inject(SpiderService);
  private readonly extractionRuleForm = inject(ExtractionRuleFormService);
  readonly matDialog = inject(MatDialog);
  // input
  readonly initData = input<SpiderItem>();
  readonly index = input<number>();
  readonly mappingsRx = input<ResourceRef<SpiderMapping[]>>();
  readonly spiderId = input<string>();
  //signal
  readonly mappings = computed(() => this.mappingsRx()?.value() ?? []);
  readonly itemMode = signal<SpiderItemMode>(SpiderItemMode.create);
  readonly isCreateMode = computed(
    () => this.itemMode() === SpiderItemMode.create
  );
  readonly isEditMode = computed(() => this.itemMode() === SpiderItemMode.edit);
  readonly isBinding = computed(() => {
    return (
      this.isEditMode() &&
      this.mappings()?.find(m => m.spiderItemId === this.spiderItemId().value())
    );
  });
  readonly hasSpiderId = computed(() => isNotBlank(this.spiderId()));
  readonly cookieRefId = computed(() => {
    if (this.itemMode() === SpiderItemMode.edit) {
      return this.spiderItemId().value();
    }
    return '';
  });
  readonly selectedHtmlFile = signal<File | null>(null);
  readonly selectedJsonFile = signal<File | null>(null);

  // form
  readonly isProcessing = signal(false);
  readonly formModel = signal({
    spiderItemId: '',
    description: '',
    itemSetting: {
      url: '',
      urlType: UrlType.BY_PRIME_KEY,
      testData: {
        html: '',
        json: '',
        resultJson: '',
      },
      mode: ExtractionRuleMode.SELECT,
      extractionRuleList: [] as ExtractionRule[],
      skipWhenUsingUrl: false,
    },
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    readonly(p, { when: () => this.isProcessing() });
    disabled(p.itemSetting.extractionRuleList, {
      when: () => this.isProcessing(),
    });
    disabled(p.spiderItemId, { when: () => this.isEditMode() });
    required(p.spiderItemId);
    applyExtractionRulesSchema(
      p.itemSetting.extractionRuleList,
      p.itemSetting.mode
    );
  });
  // constants
  readonly eUrlType = UrlType;
  readonly CodeEditorLanguages = languages;
  readonly eCookieListMapType = CookieListMapType;
  readonly eHeadersMapType = HeadersMapType;
  get spiderItemId() {
    return this.form.spiderItemId;
  }

  get description() {
    return this.form.description;
  }
  get url() {
    return this.form.itemSetting.url;
  }
  get urlType() {
    return this.form.itemSetting.urlType;
  }
  get htmlData() {
    return this.form.itemSetting.testData.html!;
  }

  get jsonData() {
    return this.form.itemSetting.testData.json!;
  }
  get resultJsonData() {
    return this.form.itemSetting.testData.resultJson!;
  }

  get extractionRuleMode() {
    return this.form.itemSetting.mode;
  }

  get extractionRuleList() {
    return this.form.itemSetting.extractionRuleList;
  }
  get skipWhenUsingUrl() {
    return this.form.itemSetting.skipWhenUsingUrl;
  }
  get modeParams() {
    return this.urlType().value() === UrlType.BY_PARAMS;
  }
  get modePrimeKey() {
    return this.urlType().value() === UrlType.BY_PRIME_KEY;
  }
  get useJsonPath() {
    return this.extractionRuleMode().value() === ExtractionRuleMode.JSON_PATH;
  }
  get useSelector() {
    return this.extractionRuleMode().value() === ExtractionRuleMode.SELECT;
  }

  constructor() {
    effect(() => {
      const item = this.initData();
      untracked(() => this.loadItem(item));
    });
  }

  private loadItem(item?: SpiderItem) {
    const initial = structuredClone(this.initialFormValue);
    const data = item ? structuredClone(item) : undefined;
    this.form().reset({
      ...initial,
      ...data,
      itemSetting: {
        ...initial.itemSetting,
        ...data?.itemSetting,
        testData: {
          ...initial.itemSetting.testData,
          ...data?.itemSetting.testData,
        },
        extractionRuleList: (data?.itemSetting.extractionRuleList ?? []).map(
          row => this.createExtractionRule(row)
        ),
      },
    });
    this.itemMode.set(
      item?.spiderItemId ? SpiderItemMode.edit : SpiderItemMode.create
    );
  }

  private runOperation<T>(
    operation: () => Observable<T>,
    onSuccess?: (value: T) => void,
    onError?: (error: unknown) => void
  ) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    defer(operation)
      .pipe(
        take(1),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({ next: onSuccess, error: error => onError?.(error) });
  }

  private buildRequest(): SpiderItem | undefined {
    this.form().markAsTouched();
    if (isBlank(this.spiderItemId().value())) {
      this.snackbarService.isBlankMessage('spider.spiderItemId');
      this.spiderItemId().focusBoundControl();
      return undefined;
    }
    if (this.form().invalid()) {
      this.snackbarService.openI18N('msg.formInvalid');
      this.form().errorSummary()[0]?.fieldTree().focusBoundControl();
      return undefined;
    }
    const value = structuredClone(this.form().value());
    return {
      ...value,
      spiderItemId: value.spiderItemId.trim(),
      description: value.description.trim(),
    };
  }

  onAddItem() {
    if (this.isProcessing()) return;
    const value = this.buildRequest();
    if (!value) return;
    this.runOperation(
      () =>
        this.spiderItemService.getBySpiderItemId(value.spiderItemId).pipe(
          switchMap(item => {
            if (item) {
              this.snackbarService.openI18N('msg.spiderItemExist');
              return EMPTY;
            }
            return this.spiderItemService.update(value);
          })
        ),
      () => {
        this.snackbarService.openI18N('msg.addSuccess');
        this.itemMode.set(SpiderItemMode.edit);
      }
    );
  }

  onSaveItem() {
    if (this.isProcessing()) return;
    const value = this.buildRequest();
    if (!value) return;
    this.runOperation(
      () => this.spiderItemService.update(value),
      () => {
        this.snackbarService.openI18N('msg.updateSuccess');
      }
    );
  }

  onReadItems() {
    this.runOperation(
      () =>
        this.spiderItemService.getAll().pipe(
          switchMap(data =>
            this.selectTableService.selectSingleSpiderItem(data)
          ),
          switchMap(item =>
            this.spiderItemService.getBySpiderItemId(item.spiderItemId)
          )
        ),
      item => this.loadItem(item)
    );
  }

  toggleBind() {
    const spiderId = this.spiderId();
    const executionOrder = this.index();
    const spiderItemId = this.spiderItemId().value();
    if (!spiderId || executionOrder === undefined || isBlank(spiderItemId))
      return;
    const wasBinding = !!this.isBinding();
    this.runOperation(
      () =>
        wasBinding
          ? this.spiderMappingService.delete(
              spiderId,
              executionOrder,
              spiderItemId
            )
          : this.spiderMappingService.update({
              spiderId,
              executionOrder,
              spiderItemId,
            }),
      () => {
        this.snackbarService.openI18N(
          wasBinding ? 'msg.unbindSuccess' : 'msg.bindSuccess'
        );
        this.mappingsRx()?.reload();
      }
    );
  }

  onClear() {
    this.runOperation(
      () => this.messageBoxService.openI18N('msg.sureClear'),
      result => {
        if (result) this.clearItem();
      }
    );
  }

  clearItem() {
    this.loadItem();
  }

  onDeleteItem() {
    const spiderItemId = this.spiderItemId().value();
    if (isBlank(spiderItemId)) return;
    this.runOperation(
      () =>
        this.spiderMappingService.inUseBySpiderItemId(spiderItemId).pipe(
          switchMap(inUse => {
            if (inUse) {
              this.snackbarService.openI18N('msg.spiderItemInUse');
              return EMPTY;
            }
            return this.messageBoxService.openI18N('msg.sureDeleteSpiderItem');
          }),
          take(1),
          switchMap(result =>
            result ? this.spiderItemService.delete(spiderItemId) : EMPTY
          )
        ),
      () => {
        this.snackbarService.openI18N('msg.deleteSuccess');
        this.clearItem();
      }
    );
  }

  onFormatJson() {
    if (this.isProcessing()) return;
    try {
      const jsonValue = this.jsonData().value();
      if (isBlank(jsonValue)) {
        return;
      }
      const parsed = JSON.parse(jsonValue);
      const formatted = JSON.stringify(parsed, null, 2);
      this.jsonData().value.set(formatted);
    } catch (e) {
      this.snackbarService.openI18N('msg.invalidJson');
    }
  }

  onTestParse() {
    if (this.isProcessing()) return;
    const value = structuredClone(this.form().value());
    this.resultJsonData().value.set('{}');
    this.runOperation(
      () => this.spiderService.previewExtraction(value),
      result => {
        this.resultJsonData().value.set(JSON.stringify(result, null, 2));
        this.snackbarService.openI18N('msg.extractSuccess');
      },
      error => {
        this.snackbarService.openI18N('msg.extractFailed', {
          message:
            error && typeof error === 'object' && 'message' in error
              ? String(error.message ?? '')
              : '',
        });
      }
    );
  }

  onTestParseWithFile(file: File | null) {
    if (!file || this.isProcessing()) return;
    const value = structuredClone(this.form().value());
    this.resultJsonData().value.set('{}');
    this.runOperation(
      () => this.spiderService.previewExtractionWithFile(value, file),
      result => {
        this.resultJsonData().value.set(JSON.stringify(result, null, 2));
        this.snackbarService.openI18N('msg.extractSuccess');
      },
      error => {
        this.snackbarService.openI18N('msg.extractFailed', {
          message:
            error && typeof error === 'object' && 'message' in error
              ? String(error.message ?? '')
              : '',
        });
      }
    );
  }

  onUpload(event: Event, selectedFileSignal: WritableSignal<File | null>) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      selectedFileSignal.set(input.files[0]);
    }
  }

  onCookiesDialog() {
    const data: CookieTableDialogData = {
      refId: this.spiderItemId().value() ?? '',
      mapType: CookieListMapType.SPIDER,
    };
    this.matDialog.open(CookieTableDialogComponent, {
      data,
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  onHeadersDialog() {
    const data: HeadersTableDialogData = {
      refId: this.spiderItemId().value() ?? '',
      mapType: HeadersMapType.SPIDER,
    };
    this.matDialog.open(HeadersTableDialogComponent, {
      data,
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  readonly createExtractionRule = (data?: Partial<ExtractionRule>) =>
    this.extractionRuleForm.createRule(data);
}
