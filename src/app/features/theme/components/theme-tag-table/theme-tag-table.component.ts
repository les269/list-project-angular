import {
  createThemeTagRow,
  normalizeThemeItem,
} from '../../util/theme-item-form';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  applyEach,
  disabled,
  form,
  required,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { FormAlert } from '../../../../core/model';
import {
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { isDuplicate } from '../../../../shared/util/helper';
import { ShareTag, ThemeItem, ThemeItemType, ThemeTagItem } from '../../models';
import { ShareTagService } from '../../services/share-tag.service';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';

@Component({
  selector: 'app-theme-tag-table',

  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    TranslatePipe,
    MatChipsModule,
    GenericTableComponent,
    FormAlertsComponent,
    ThemeItemManageComponent,
  ],
  templateUrl: './theme-tag-table.component.html',
})
export class ThemeTagTableComponent {
  readonly translateService = inject(TranslateService);
  readonly selectTableService = inject(SelectTableService);
  readonly shareTagService = inject(ShareTagService);

  readonly headerId = input<string>();
  readonly tagItem = input<ThemeTagItem>();

  readonly itemManager = viewChild(ThemeItemManageComponent);
  readonly formModel = signal<ThemeTagItem>({
    type: ThemeItemType.TAG,
    itemId: '',
    description: '',
    json: [],
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    disabled(p.itemId, {
      when: () => this.itemManager()?.isEditMode() ?? false,
    });
    validate(p.json, ({ value }) =>
      isDuplicate(
        value()
          .map(row => row.shareTagId)
          .filter(Boolean)
      )
        ? { kind: 'duplicateByShareTagId' }
        : undefined
    );
    validate(p.json, ({ value }) =>
      value().some(row => !row.shareTagId)
        ? { kind: 'shareTagIdEmpty' }
        : undefined
    );

    applyEach(p.json, p => {
      required(p.shareTagId);
    });
    required(p.itemId);
  });
  readonly fields = this.form.json;

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
  private readonly validationMessages = toSignal(
    this.translateService.stream([
      'msg.duplicateColumn',
      'themeTag.shareTag',
      'themeTag.shareTagIdEmpty',
    ]),
    {
      initialValue: this.translateService.instant([
        'msg.duplicateColumn',
        'themeTag.shareTag',
        'themeTag.shareTagIdEmpty',
      ]),
    }
  );
  readonly formAlerts = computed(() => {
    const messages = this.validationMessages();
    return [
      {
        errorId: 'duplicateByShareTagId',
        msg: this.translateService.instant('msg.duplicateColumn', {
          text: messages['themeTag.shareTag'],
        }),
      },
      {
        errorId: 'shareTagIdEmpty',
        msg: messages['themeTag.shareTagIdEmpty'],
      },
    ] satisfies FormAlert[];
  });
  readonly tags = rxResource({
    stream: () => this.shareTagService.getAllTag(),
    defaultValue: [],
  });

  constructor() {
    effect(() => {
      const data = this.tagItem();
      if (!data) return;
      untracked(() => this.loadItem(data));
    });
  }

  readonly createRow = createThemeTagRow;

  loadItem(data: ThemeItem) {
    if (data.type !== ThemeItemType.TAG) return;
    this.form().reset(normalizeThemeItem(data, this.initialFormValue));
  }
}
