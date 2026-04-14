import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  inject,
  input,
  Input,
  Output,
  ResourceRef,
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
  ExtractionRule,
  SpiderItem,
  SpiderMapping,
  UrlType,
} from '../../model';
import { ToFormArray } from '../../../../core/model';

@Component({
  selector: 'app-spider-item',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ReactiveFormsModule],
  templateUrl: './spider-item.component.html',
})
export class SpiderItemComponent {
  // inject
  readonly fb = inject(FormBuilder);
  readonly translateService = inject(TranslateService);
  // input
  readonly item = input<SpiderItem>();
  readonly index = input<number>();
  readonly mappingRef = input<ResourceRef<SpiderMapping[]>>();
  // form
  readonly form = this.fb.group({
    spiderItemId: ['', [Validators.required]],
    description: [''],
    url: [''],
    urlType: [UrlType.BY_REDIRECT],
    redirectUrlKey: [''],
    testData: this.fb.group({
      html: [''],
      json: [''],
      resultJson: [''],
    }),
    extractionRuleList: this.fb.array([]),
  });

  get spiderItemId() {
    return this.form.controls.spiderItemId;
  }

  get description() {
    return this.form.controls.description;
  }
  get url() {
    return this.form.controls.url;
  }
  get urlType() {
    return this.form.controls.urlType;
  }

  get redirectUrlKey() {
    return this.form.controls.redirectUrlKey;
  }

  get htmlData() {
    return this.form.controls.testData.controls.html!;
  }

  get jsonData() {
    return this.form.controls.testData.controls.json!;
  }
  get resultJsonData() {
    return this.form.controls.testData.controls.resultJson!;
  }

  get extractionRuleList() {
    return this.form.get('extractionRuleList') as ToFormArray<ExtractionRule>;
  }

  constructor() {
    effect(() => {
      const item = this.item();
      if (item) {
        this.form.patchValue(item, { emitEvent: false });
      }
    });
  }
}
