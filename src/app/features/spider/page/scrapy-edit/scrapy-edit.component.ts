import { CodeEditor } from '@acrodata/code-editor';
import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  disabled,
  form,
  FormField,
  min,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { languages } from '@codemirror/language-data';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EMPTY, filter, map, switchMap } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank, isNotJson } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { CssSelectTableComponent } from '../../components/css-select-table/css-select-table.component';
import {
  ScrapyConfig,
  ScrapyData,
  ScrapyEditMode,
  ScrapyPageType,
} from '../../model';
import { ScrapyService } from '../../services/scrapy.service';
import { createCssSelect } from '../../util/css-select';

@Component({
  imports: [
    MatTableModule,
    FormField,
    MatButtonModule,
    TranslatePipe,
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

  // form
  readonly formModel = signal({
    name: '',
    paramSize: 1,
    testJson: '',
    testUrl: '',
    data: [] as ScrapyData[],
  });
  readonly form = form(this.formModel, p => {
    disabled(p.name, { when: () => this.isEditMode });

    required(p.name);
    required(p.paramSize);
    min(p.paramSize, 1);
  });

  get isCreateMode() {
    return this.status() === ScrapyEditMode.create;
  }

  get isEditMode() {
    return this.status() === ScrapyEditMode.edit;
  }

  get nameControl() {
    return this.form.name;
  }

  get dataControl() {
    return this.form.data;
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
      untracked(() => {
        this.patchForm(scrapy);
        this.status.set(ScrapyEditMode.edit);
      });
    });
  }

  private patchForm(config: ScrapyConfig) {
    this.form().reset({
      name: config.name,
      paramSize: config.paramSize,
      testJson: config.testJson ?? '',
      testUrl: config.testUrl ?? '',
      data: (config.data ?? []).map(data =>
        this.createData(structuredClone(data))
      ),
    });
  }

  createData(data?: Partial<ScrapyData>): ScrapyData {
    return {
      name: data?.name ?? '',
      url: data?.url ?? '',
      cookie: data?.cookie ?? [],
      scrapyPageType: data?.scrapyPageType ?? ScrapyPageType.scrapyData,
      cssSelectList: (data?.cssSelectList ?? []).map(createCssSelect),
      script: data?.script ?? this.defaultJS,
      html: data?.html ?? '',
      replaceRegular: data?.replaceRegular ?? '',
      replaceRegularTo: data?.replaceRegularTo ?? '',
    };
  }

  onAddData() {
    this.dataControl().value.update(rows => [...rows, this.createData()]);
  }

  onDeleteData(i: number) {
    this.dataControl().value.update(rows =>
      rows.filter((_, index) => index !== i)
    );
  }

  onBack() {
    this.router.navigate(['scrapy-list']);
  }

  onTestParseHtml(index: number) {
    const data = this.dataControl[index]().value() as ScrapyData;
    this.scrapyService
      .testScrapyHtml({ scrapyData: data })
      .subscribe(result => {
        this.testResult.set(JSON.stringify(result, undefined, 2));
      });
  }

  onTestJson() {
    const testJson = this.form.testJson().value();
    if (isNotJson(testJson) || !Array.isArray(JSON.parse(testJson))) {
      this.snackbarService.openI18N('msg.testJsonError');
      return;
    }
    this.testResult.set('');
    this.scrapyService
      .testScrapyJson({
        scrapyDataList: this.dataControl().value() as ScrapyData[],
        json: JSON.parse(testJson),
      })
      .subscribe(result => {
        this.testResult.set(JSON.stringify(result, undefined, 2));
      });
  }

  onTestUrl() {
    this.scrapyService
      .testScrapyUrl({
        scrapyDataList: this.dataControl().value() as ScrapyData[],
        url: this.form.testUrl().value(),
      })
      .subscribe(result => {
        this.testResult.set(JSON.stringify(result, undefined, 2));
      });
  }

  update(back: boolean, type: 'save' | 'commit') {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const data = this.form().value() as unknown as ScrapyConfig;
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
    this.dataControl().value.update(rows => {
      if (targetIndex < 0 || targetIndex >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    this.dataControl().markAsDirty();
    this.selected.set(targetIndex);
  }
}
