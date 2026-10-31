import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  disabled,
  form,
  FormField,
  min,
  required,
  readonly,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { languages } from '@codemirror/language-data';
import { TranslateModule } from '@ngx-translate/core';
import {
  defer,
  EMPTY,
  filter,
  finalize,
  map,
  Observable,
  switchMap,
  take,
} from 'rxjs';
import { EditMode } from '../../../../core/model';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { SpiderItemComponent } from '../../components/spider-item/spider-item.component';
import {
  ExtractionRuleMode,
  SpiderConfig,
  SpiderItem,
  SpiderMapping,
  SpiderReq,
  UrlType,
} from '../../model';
import { SpiderService } from '../../services';
import { SpiderConfigService } from '../../services/spider-config.service';
import { SpiderItemService } from '../../services/spider-item.service';
import { SpiderMappingService } from '../../services/spider-mapping.service';

@Component({
  selector: 'app-spider-edit',
  templateUrl: './spider-edit.component.html',
  imports: [
    CommonModule,
    FormField,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTabsModule,
    DragDropModule,
    TranslateModule,
    SpiderItemComponent,
    SignalCodeEditorComponent,
    TrimOnBlurDirective,
  ],
})
export class SpiderEditComponent {
  //inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly spiderConfigService = inject(SpiderConfigService);
  readonly spiderMappingService = inject(SpiderMappingService);
  readonly spiderItemService = inject(SpiderItemService);
  readonly spiderService = inject(SpiderService);
  readonly snackbarService = inject(SnackbarService);
  readonly messageBoxService = inject(MessageBoxService);
  // constants
  readonly languages = languages;
  readonly editMode = EditMode;

  // signals
  readonly isProcessing = signal(false);
  readonly status = signal<EditMode>(EditMode.CREATE);

  readonly spiderId = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('spiderId')),
      filter(spiderId => isNotBlank(spiderId))
    ),
    { initialValue: undefined }
  );

  readonly spider = rxResource({
    params: () => this.spiderId(),
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }
      return this.spiderConfigService.getBySpiderId(params);
    },
    defaultValue: undefined,
  });
  readonly itemsRx = rxResource({
    params: () => this.spiderId(),
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }
      return this.spiderItemService.getItemBySpiderId(params);
    },
    defaultValue: [],
  });
  readonly spiderItems = linkedSignal(() => this.itemsRx.value());
  readonly showDeleteItemButton = computed(() => {
    const selectedIndex = this.selected();
    return selectedIndex > 0 && selectedIndex <= this.spiderItems().length;
  });

  readonly mappingsRx = rxResource({
    params: () => this.spiderId(),
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }
      return this.spiderMappingService.getBySpiderId(params);
    },
    defaultValue: [],
  });
  readonly mappings = linkedSignal(() =>
    [...this.mappingsRx.value()].sort(
      (a, b) => a.executionOrder - b.executionOrder
    )
  );
  readonly getMappingItemId = (index: number) => {
    const mapping = this.mappings().find(m => m.executionOrder === index);
    return mapping ? mapping.spiderItemId : null;
  };

  readonly initialTabIndex = computed(() => {
    const raw = this.route.snapshot.queryParamMap.get('tab');
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
  });
  readonly selected = linkedSignal(() => {
    if (this.itemsRx.isLoading()) {
      return 0;
    }
    const maxTabIndex = this.spiderItems().length;
    const initialTabIndex = this.initialTabIndex();
    return initialTabIndex <= maxTabIndex ? initialTabIndex : 0;
  });

  // form
  readonly formModel = signal({
    spiderId: '',
    description: '',
    primeKeySize: 1,
    isUrlBased: false,
    testData: {
      primeKeyListJson: '[]',
      url: '',
      resultJson: '',
    },
  });
  readonly form = form(this.formModel, p => {
    readonly(p, { when: () => this.isProcessing() });
    disabled(p.spiderId, { when: () => this.isEditMode });
    required(p.spiderId);
    required(p.primeKeySize);
    min(p.primeKeySize, ({ valueOf }) => (valueOf(p.isUrlBased) ? 0 : 1));
  });

  get isCreateMode() {
    return this.status() === this.editMode.CREATE;
  }

  get isEditMode() {
    return this.status() === this.editMode.EDIT;
  }

  get spiderIdControl() {
    return this.form.spiderId;
  }

  get isUrlBasedControl() {
    return this.form.isUrlBased;
  }

  get canDragTabs(): boolean {
    return this.mappings().length === this.spiderItems().length;
  }

  get testDataUrl(): string {
    const url = this.form.testData.url().value();
    return url ? url : '';
  }

  get resultJson() {
    return this.form.testData.resultJson;
  }

  get testDataPrimeKeyListJson(): string {
    const primeKeyListJson = this.form.testData.primeKeyListJson().value();
    return primeKeyListJson ? primeKeyListJson : '';
  }

  constructor() {
    effect(() => {
      const spiderId = this.spiderId();
      const spider = this.spider.value();
      if (spiderId === undefined || spider === undefined) {
        return;
      }
      if (spider === null) {
        this.router.navigate(['spider-list']);
        return;
      }
      untracked(() => {
        this.patchForm(spider);
        this.status.set(this.editMode.EDIT);
      });
    });
  }

  private patchForm(config: SpiderConfig) {
    this.form().reset({
      spiderId: config.spiderId,
      description: config.description ?? '',
      primeKeySize: config.primeKeySize ?? 1,
      isUrlBased: config.isUrlBased ?? false,
      testData: {
        primeKeyListJson: JSON.stringify(
          config.testData?.primeKeyList ?? [],
          undefined,
          2
        ),
        url: config.testData?.url ?? '',
        resultJson: config.testData?.resultJson ?? '',
      },
    });
  }

  private buildPayload(): SpiderConfig | null {
    const formValue = this.form().value();
    const primeKeyList = this.parsePrimeKeyList(
      formValue.testData.primeKeyListJson
    );
    if (!primeKeyList) return null;

    return {
      spiderId: formValue.spiderId,
      description: formValue.description,
      primeKeySize: formValue.primeKeySize,
      isUrlBased: formValue.isUrlBased,
      testData: {
        primeKeyList,
        url: formValue.testData.url,
        resultJson: formValue.testData.resultJson,
      },
    };
  }

  private parsePrimeKeyList(json: string): string[] | undefined {
    try {
      const value: unknown = JSON.parse(json.trim() || '[]');
      if (Array.isArray(value) && value.every(item => typeof item === 'string'))
        return value;
    } catch {
      // 語法錯誤與非字串陣列使用相同提示，避免送出無效的預覽請求。
    }
    this.snackbarService.openI18N('msg.spiderPrimeKeyListError');
    return undefined;
  }

  private runOperation<T>(
    operation: () => Observable<T>,
    onSuccess?: (value: T) => void,
    onError?: () => void
  ) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    defer(operation)
      .pipe(
        take(1),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({ next: onSuccess, error: () => onError?.() });
  }

  onBack() {
    this.router.navigate(['spider-list']);
  }

  onAddItemTab() {
    if (this.isProcessing()) return;
    if (!this.isEditMode) {
      this.snackbarService.openI18N('msg.spiderSaveFirst');
      return;
    }
    this.spiderItems.update(list => [
      ...list,
      {
        spiderItemId: '',
        description: '',
        itemSetting: {
          url: '',
          urlType: UrlType.BY_PRIME_KEY,
          mode: ExtractionRuleMode.SELECT,
          testData: { html: '', json: '', resultJson: '' },
          extractionRuleList: [],
          skipWhenUsingUrl: false,
          useCookie: false,
        },
      },
    ]);
    this.selected.set(this.spiderItems().length);
  }

  onDeleteItemTab() {
    const selectedIndex = this.selected();
    this.runOperation(
      () => this.messageBoxService.openI18N('msg.sureDeleteSpiderItem'),
      result => {
        if (
          !result ||
          selectedIndex <= 0 ||
          selectedIndex > this.spiderItems().length
        )
          return;
        const tabs = [...this.spiderItems()];
        tabs.splice(selectedIndex - 1, 1);
        this.spiderItems.set(tabs);
        if (selectedIndex >= tabs.length) this.selected.set(tabs.length);
      }
    );
  }

  onTabChange(index: number) {
    this.selected.set(index);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: index },
      queryParamsHandling: 'merge',
    });
  }

  dropTab(event: CdkDragDrop<SpiderItem[]>) {
    if (
      this.isProcessing() ||
      !this.canDragTabs ||
      event.previousIndex === event.currentIndex
    ) {
      return;
    }

    const tabs = [...this.spiderItems()];
    const selectedIndex = this.selected();
    const spiderId = this.spiderId();
    if (!spiderId) {
      return;
    }

    const reorderedMappings = this.buildReorderedMappings(
      this.mappings(),
      spiderId,
      event.previousIndex,
      event.currentIndex
    );
    const previousMappings = [...this.mappings()];
    const previousTabs = [...tabs];

    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    this.spiderItems.set(tabs);
    this.mappings.set(reorderedMappings);

    this.runOperation(
      () => this.spiderMappingService.updateList(reorderedMappings),
      undefined,
      () => {
        this.spiderItems.set(previousTabs);
        this.mappings.set(previousMappings);
        this.selected.set(selectedIndex);
      }
    );
  }

  update() {
    if (this.isProcessing()) return;
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }

    const data = this.buildPayload();
    if (!data) {
      return;
    }

    this.runOperation(
      () =>
        this.spiderConfigService.isInUse(data.spiderId).pipe(
          switchMap(exist => {
            if (this.isCreateMode && exist) {
              this.snackbarService.openI18N('msg.spiderExist');
              return EMPTY;
            }
            if (this.isEditMode && !exist) {
              this.snackbarService.openI18N('msg.spiderNotExist');
              return EMPTY;
            }
            return this.spiderConfigService.update(data);
          })
        ),
      () => {
        if (this.isCreateMode) {
          this.status.set(this.editMode.EDIT);

          this.router.navigate(['spider-edit', data.spiderId], {
            replaceUrl: true,
          });
        }
        this.snackbarService.openI18N('msg.saveSuccess');
      }
    );
  }

  onPreviewByPrimeKeyList() {
    if (this.isProcessing()) return;
    const primeKeyList = this.parsePrimeKeyList(this.testDataPrimeKeyListJson);
    if (!primeKeyList) return;
    const data: SpiderReq = {
      spiderId: this.spiderIdControl().value(),
      primeKeyList,
    };
    this.resultJson().value.set('{}');
    this.runOperation(
      () => this.spiderService.executeByPrimeKeyList(data),
      result => {
        this.resultJson().value.set(JSON.stringify(result, undefined, 2));
      }
    );
  }

  onPreviewByUrl() {
    if (this.isProcessing()) return;
    const data: SpiderReq = {
      spiderId: this.spiderIdControl().value(),
      url: this.testDataUrl,
    };
    this.resultJson().value.set('{}');
    this.runOperation(
      () => this.spiderService.executeByUrl(data),
      result => {
        this.resultJson().value.set(JSON.stringify(result, undefined, 2));
      }
    );
  }

  private buildReorderedMappings(
    mappings: SpiderMapping[],
    spiderId: string,
    previousIndex: number,
    currentIndex: number
  ): SpiderMapping[] {
    const reorderedMappings = [...mappings];
    moveItemInArray(reorderedMappings, previousIndex, currentIndex);
    return reorderedMappings.map((mapping, index) => ({
      ...mapping,
      spiderId,
      executionOrder: index,
    }));
  }
}
