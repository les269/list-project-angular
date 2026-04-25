import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormArray,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeItem, ThemeItemType, ThemeTag, ThemeTagItem } from '../../models';
import { ShareTagService } from '../../services/share-tag.service';
import { ShareTag } from '../../models';
import { isDuplicate } from '../../../../shared/util/helper';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { MatChipsModule } from '@angular/material/chips';
import { rxResource } from '@angular/core/rxjs-interop';
import { SelectTableService } from '../../../../core/services/select-table.service';
import {
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { FormAlert } from '../../../../core/model';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';

@Component({
  selector: 'app-theme-tag-table',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    TranslateModule,
    MatChipsModule,
    GenericTableComponent,
    FormAlertsComponent,
    ThemeItemManageComponent,
  ],
  templateUrl: './theme-tag-table.component.html',
})
export class ThemeTagTableComponent implements OnInit {
  readonly translateService = inject(TranslateService);
  readonly selectTableService = inject(SelectTableService);
  readonly shareTagService = inject(ShareTagService);
  readonly fb = inject(FormBuilder);

  readonly headerId = input<string>();
  readonly tagItem = input<ThemeTagItem>();
  readonly oldData = input<ThemeTag[]>();

  readonly form = this.fb.group({
    itemId: ['', [Validators.required]],
    description: [''],
    json: this.fb.array([]),
  });
  readonly formArray = this.form.get('json') as ToFormArray<ThemeTag>;

  readonly initData = computed(() => {
    const resetData = this.resetData();
    if (resetData) {
      return resetData;
    }
    return this.tagItem()?.json || this.oldData() || [];
  });
  readonly resetData = signal<ThemeTag[] | null>(null);
  readonly defaultBinding = computed(() => (this.tagItem() ? true : false));
  readonly eThemeItemType = ThemeItemType;

  readonly displayedColumns: string[] = ['shareTagId'];
  readonly cols = computed(
    () =>
      [
        {
          key: 'shareTagId',
          label: 'themeTag.shareTag',
          columnType: GenericColumnType.chipSelect,
          data: this.tags.value(),
          dataValue: 'shareTagId',
          dataLabel: item => item['shareTagName'],
          openDialog: () =>
            this.selectTableService.selectSingleShareTag(this.tags.value()),
          width: '100%',
          required: true,
        } satisfies GenericTableColumn<ShareTag>,
      ] satisfies GenericTableColumn[]
  );
  readonly formAlerts = computed(
    () =>
      [
        {
          errorId: 'duplicateByShareTagId',
          msg: this.translateService.instant('msg.duplicateColumn', {
            text: this.translateService.instant('themeTag.shareTag'),
          }),
        },
        {
          errorId: 'shareTagIdEmpty',
          msg: this.translateService.instant('themeTag.shareTagIdEmpty'),
        },
      ] satisfies FormAlert[]
  );
  readonly tags = rxResource({
    stream: () => this.shareTagService.getAllTag(),
    defaultValue: [],
  });

  constructor() {
    effect(() => {
      const data = this.tagItem();
      if (!data) return;
      this.form.patchValue(data);
    });
  }

  ngOnInit(): void {
    const arr = this.formArray;
    arr.setValidators([
      this.shareTagIdDuplicateValidator(),
      this.shareTagIdEmptyValidator(),
    ]);
    arr.updateValueAndValidity({ emitEvent: false });
  }

  readonly createGroup = () => {
    return this.fb.group({
      seq: [0],
      shareTagId: ['', [Validators.required]],
    });
  };

  shareTagIdEmptyValidator() {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const arr = ctrl as FormArray;
      if (arr.controls.length === 0) return null;
      const keys = arr.controls.find(
        c => c.get('shareTagId')?.value.length === 0
      );
      if (!!keys) {
        return { shareTagIdEmpty: true };
      }
      return null;
    };
  }

  shareTagIdDuplicateValidator() {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const arr = ctrl as FormArray;
      const keys: string[] = arr.controls
        .map(c => c.get('shareTagId')?.value)
        .filter(k => k);
      if (isDuplicate(keys)) {
        return { duplicateByShareTagId: true };
      }
      return null;
    };
  }

  jsonReset(data: ThemeItem) {
    if (data.type !== ThemeItemType.TAG) return;
    this.resetData.set(data.json);
  }
}
