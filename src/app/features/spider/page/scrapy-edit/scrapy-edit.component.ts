import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  Cookie,
  CssSelect,
  ScrapyConfig,
  ScrapyData,
  ScrapyEditMode,
  ScrapyPageType,
} from '../../model';
import { ScrapyService } from '../../services/scrapy.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { languages } from '@codemirror/language-data';
import { CodeEditor } from '@acrodata/code-editor';
import { Router, ActivatedRoute } from '@angular/router';
import { EMPTY, filter, map, switchMap } from 'rxjs';
import { isNotBlank, isNotJson } from '../../../../shared/util/helper';
import { MatTabsModule } from '@angular/material/tabs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ControlsOf } from '../../../../core/model/generic-table';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { CssSelectTableComponent } from '../../components/css-select-table/css-select-table.component';
import { ToFormArray } from '../../../../core/model/generic-table';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';

type ScrapyDataFormControls = {
  name: FormControl<string>;
  url: FormControl<string>;
  cookie: ToFormArray<Cookie>;
  scrapyPageType: FormControl<ScrapyPageType>;
  cssSelectList: ToFormArray<CssSelect>;
  script: FormControl<string>;
  html: FormControl<string>;
  replaceRegular: FormControl<string>;
  replaceRegularTo: FormControl<string>;
};

@Component({
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    CodeEditor,
    MatTabsModule,
    MatTooltipModule,
    MatCheckboxModule,
    CssSelectTableComponent,
    TrimOnBlurDirective,
  ],
  selector: 'app-scrapy-edit',
  templateUrl: './scrapy-edit.component.html',
})
export class ScrapyEditComponent {
  // inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly scrapyService = inject(ScrapyService);
  readonly translateService = inject(TranslateService);
  readonly snackbarService = inject(SnackbarService);
  readonly fb = inject(FormBuilder);
  // enum and constant
  readonly eScrapyPageType = ScrapyPageType;
  readonly languages = languages;
  readonly defaultJS = this.translateService.instant('scrapy.defaultJS');
  // signal
  readonly status = signal(ScrapyEditMode.create);
  readonly selected = signal(-1);
  readonly testResult = signal('');

  readonly scrapyName = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('name')),
      filter(name => isNotBlank(name))
    ),
    { initialValue: undefined }
  );

  readonly scrapy = rxResource({
    params: () => this.scrapyName(),
    stream: ({ params }) => {
      if (!params) return EMPTY;
      return this.scrapyService.findConfig(params);
    },
    defaultValue: undefined,
  });
  readonly dataInit = computed(() => this.scrapy.value()?.data ?? []);

  // form
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    paramSize: [1, [Validators.required, Validators.min(1)]],
    testJson: [''],
    testUrl: [''],
    data: this.fb.array<FormGroup<ScrapyDataFormControls>>([]),
  });

  get isCreateMode() {
    return this.status() === ScrapyEditMode.create;
  }

  get isEditMode() {
    return this.status() === ScrapyEditMode.edit;
  }

  get nameControl(): FormControl<string> {
    return this.form.controls.name;
  }

  get dataControl() {
    return this.form.controls.data;
  }

  constructor() {
    effect(() => {
      const name = this.scrapyName();
      const scrapy = this.scrapy.value();
      if (name === undefined || scrapy === undefined) return;
      if (scrapy === null) {
        this.router.navigate(['scrapy-list']);
        return;
      }
      this.patchForm(scrapy);
      this.status.set(ScrapyEditMode.edit);
      this.form.controls.name.disable({ emitEvent: false });
    });
  }

  private patchForm(config: ScrapyConfig) {
    const { data, ...rest } = config;
    this.form.patchValue(rest, { emitEvent: false });
    this.dataControl.clear();
    for (const d of data) {
      this.dataControl.push(this.createDataGroup(d));
    }
  }

  createDataGroup(
    data?: Partial<ScrapyData>
  ): FormGroup<ScrapyDataFormControls> {
    return this.fb.nonNullable.group({
      name: [data?.name ?? ''],
      url: [data?.url ?? ''],
      cookie: this.fb.array<FormGroup<ControlsOf<Cookie>>>([]),
      scrapyPageType: [data?.scrapyPageType ?? ScrapyPageType.scrapyData],
      cssSelectList: this.fb.array<FormGroup<ControlsOf<CssSelect>>>([]),
      script: [data?.script ?? this.defaultJS],
      html: [data?.html ?? ''],
      replaceRegular: [data?.replaceRegular ?? ''],
      replaceRegularTo: [data?.replaceRegularTo ?? ''],
    });
  }

  onAddData() {
    this.dataControl.push(this.createDataGroup());
  }

  onDeleteData(i: number) {
    this.dataControl.removeAt(i);
  }

  onBack() {
    this.router.navigate(['scrapy-list']);
  }

  onTestParseHtml(index: number) {
    const data = this.dataControl.at(index).getRawValue() as ScrapyData;
    this.scrapyService
      .testScrapyHtml({ scrapyData: data })
      .subscribe(result => {
        this.testResult.set(JSON.stringify(result, undefined, 2));
      });
  }

  onTestJson() {
    const testJson = this.form.controls.testJson.value;
    if (isNotJson(testJson) || !Array.isArray(JSON.parse(testJson))) {
      this.snackbarService.openI18N('msg.testJsonError');
      return;
    }
    this.testResult.set('');
    this.scrapyService
      .testScrapyJson({
        scrapyDataList: this.dataControl.getRawValue() as ScrapyData[],
        json: JSON.parse(testJson),
      })
      .subscribe(result => {
        this.testResult.set(JSON.stringify(result, undefined, 2));
      });
  }

  onTestUrl() {
    this.scrapyService
      .testScrapyUrl({
        scrapyDataList: this.dataControl.getRawValue() as ScrapyData[],
        url: this.form.controls.testUrl.value,
      })
      .subscribe(result => {
        this.testResult.set(JSON.stringify(result, undefined, 2));
      });
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = this.form.getRawValue() as unknown as ScrapyConfig;
    this.scrapyService
      .existConfig(data.name)
      .pipe(
        switchMap(exist => {
          if (this.isCreateMode && exist) {
            this.snackbarService.openI18N('msg.scrapyExist');
            return EMPTY;
          }
          if (this.isEditMode && !exist) {
            this.snackbarService.openI18N('msg.scrapyNotExist');
            return EMPTY;
          }
          return this.scrapyService.updateConfig(data);
        })
      )
      .subscribe(() => {
        if (back) {
          this.router.navigate(['scrapy-list']);
        }
        this.snackbarService.openI18N(
          type === 'commit' ? 'msg.commitSuccess' : 'msg.saveSuccess'
        );
      });
  }

  moveTab(index: number, type: 'left' | 'right') {
    const targetIndex = index + (type === 'left' ? -1 : 1);
    const a = this.dataControl.at(index);
    const b = this.dataControl.at(targetIndex);
    this.dataControl.setControl(index, b);
    this.dataControl.setControl(targetIndex, a);
    this.selected.set(targetIndex);
  }
}
