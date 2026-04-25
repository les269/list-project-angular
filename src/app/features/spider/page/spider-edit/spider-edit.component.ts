import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, filter, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank, isNotJson } from '../../../../shared/util/helper';
import {
  ExtractionRuleMode,
  SpiderConfig,
  SpiderItem,
  SpiderMapping,
  UrlType,
} from '../../model';
import { SpiderConfigService } from '../../services/spider-config.service';
import { SpiderMappingService } from '../../services/spider-mapping.service';
import { SpiderItemComponent } from '../../components/spider-item/spider-item.component';
import { CodeEditor } from '@acrodata/code-editor';
import { languages } from '@codemirror/language-data';
import { SpiderItemService } from '../../services/spider-item.service';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';

type SpiderEditMode = 'create' | 'edit';

@Component({
  standalone: true,
  selector: 'app-spider-edit',
  templateUrl: './spider-edit.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTabsModule,
    DragDropModule,
    TranslateModule,
    SpiderItemComponent,
    CodeEditor,
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
  readonly snackbarService = inject(SnackbarService);
  readonly messageBoxService = inject(MessageBoxService);
  readonly fb = inject(FormBuilder);
  // constants
  readonly languages = languages;

  // signals
  readonly status = signal<SpiderEditMode>('create');
  readonly selected = signal(0);
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

  // form
  readonly form = this.fb.nonNullable.group({
    spiderId: ['', Validators.required],
    description: [''],
    primeKeySize: [1, [Validators.required, Validators.min(1)]],
    isUrlBased: [false],
    testData: this.fb.nonNullable.group({
      pkArrayJson: ['[]'],
      url: [''],
      resultJson: [''],
    }),
  });

  get isCreateMode() {
    return this.status() === 'create';
  }

  get isEditMode() {
    return this.status() === 'edit';
  }

  get spiderIdControl(): FormControl<string> {
    return this.form.controls.spiderId;
  }

  get isUrlBasedControl(): FormControl<boolean> {
    return this.form.controls.isUrlBased;
  }

  get canDragTabs(): boolean {
    return this.mappings().length === this.spiderItems().length;
  }

  constructor() {
    this.form.controls.isUrlBased.valueChanges
      .pipe(startWith(this.form.controls.isUrlBased.value))
      .subscribe(isUrlBased => {
        const validators = isUrlBased
          ? [Validators.required, Validators.min(0)]
          : [Validators.required, Validators.min(1)];
        this.form.controls.primeKeySize.setValidators(validators);
        this.form.controls.primeKeySize.updateValueAndValidity({
          emitEvent: false,
        });
      });

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
      this.patchForm(spider);
      this.status.set('edit');
      this.form.controls.spiderId.disable({ emitEvent: false });
    });
  }

  private patchForm(config: SpiderConfig) {
    this.form.patchValue(
      {
        spiderId: config.spiderId,
        description: config.description,
        primeKeySize: config.primeKeySize,
        isUrlBased: config.isUrlBased,
        testData: {
          pkArrayJson: JSON.stringify(
            config.testData?.pkArray ?? [],
            undefined,
            2
          ),
          url: config.testData?.url ?? '',
          resultJson: config.testData?.resultJson ?? '',
        },
      },
      { emitEvent: false }
    );
  }

  private buildPayload(): SpiderConfig | null {
    const formValue = this.form.getRawValue();
    const pkArrayJson = formValue.testData.pkArrayJson.trim() || '[]';
    if (isNotJson(pkArrayJson)) {
      this.snackbarService.openI18N('msg.spiderPkArrayError');
      return null;
    }

    const pkArray = JSON.parse(pkArrayJson);
    if (
      !Array.isArray(pkArray) ||
      pkArray.some(value => typeof value !== 'string')
    ) {
      this.snackbarService.openI18N('msg.spiderPkArrayError');
      return null;
    }

    return {
      spiderId: formValue.spiderId,
      description: formValue.description,
      primeKeySize: formValue.primeKeySize,
      isUrlBased: formValue.isUrlBased,
      testData: {
        pkArray,
        url: formValue.testData.url,
        resultJson: formValue.testData.resultJson,
      },
    };
  }

  onBack() {
    this.router.navigate(['spider-list']);
  }

  onAddItemTab() {
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
    this.messageBoxService
      .openI18N('msg.sureDeleteSpiderItem')
      .subscribe(result => {
        if (result) {
          const selectedIndex = this.selected();
          if (selectedIndex <= 0 || selectedIndex > this.spiderItems().length) {
            return;
          }

          const targetIndex = selectedIndex - 1;
          const tabs = [...this.spiderItems()];
          tabs.splice(targetIndex, 1);
          this.spiderItems.set(tabs);

          if (selectedIndex >= tabs.length) {
            this.selected.set(tabs.length);
          }
        }
      });
  }

  dropTab(event: CdkDragDrop<SpiderItem[]>) {
    if (!this.canDragTabs && event.previousIndex === event.currentIndex) {
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

    this.spiderMappingService.updateList(reorderedMappings).subscribe({
      error: () => {
        this.spiderItems.set(previousTabs);
        this.mappings.set(previousMappings);
        this.selected.set(selectedIndex);
      },
    });
  }

  update() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.buildPayload();
    if (!data) {
      return;
    }

    this.spiderConfigService
      .isInUse(data.spiderId)
      .pipe(
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
      )
      .subscribe(() => {
        if (this.isCreateMode) {
          this.status.set('edit');
          this.form.controls.spiderId.disable({ emitEvent: false });
          this.router.navigate(['spider-edit', data.spiderId], {
            replaceUrl: true,
          });
        }
        this.snackbarService.openI18N('msg.saveSuccess');
      });
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
