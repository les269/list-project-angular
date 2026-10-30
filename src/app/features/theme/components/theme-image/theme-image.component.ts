import { toSignal } from '@angular/core/rxjs-interop';
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
import {
  disabled,
  form,
  FormField,
  required,
  validate,
} from '@angular/forms/signals';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { FormAlert } from '../../../../core/model';
import { isBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import {
  ThemeHeaderType,
  ThemeImageItem,
  ThemeImageType,
  ThemeItemType,
} from '../../models';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { normalizeThemeItem } from '../../util/theme-item-form';

@Component({
  selector: 'app-theme-image',
  imports: [
    TranslateModule,
    FormField,
    FormAlertsComponent,
    ThemeItemManageComponent,
    TrimOnBlurDirective,
  ],
  templateUrl: './theme-image.component.html',
})
export class ThemeImageComponent {
  //inject
  readonly translateService = inject(TranslateService);
  //input
  readonly headerId = input<string>();
  readonly imageItem = input<ThemeImageItem>();
  readonly themeHeaderType = input<ThemeHeaderType>();
  //enum
  readonly eThemeImageType = ThemeImageType;
  readonly eThemeItemType = ThemeItemType;
  //signals
  readonly defaultBinding = computed(() => !!this.imageItem());
  readonly itemManager = viewChild(ThemeItemManageComponent);
  readonly formModel = signal<ThemeImageItem>({
    type: ThemeItemType.IMAGE,
    itemId: '',
    description: '',
    json: {
      imageKey: '',
      imageUrl: '',
      type: ThemeImageType.key,
    },
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    disabled(p.itemId, {
      when: () => this.itemManager()?.isEditMode() ?? false,
    });
    validate(p.json, ({ value }) => {
      if (this.themeHeaderType() !== ThemeHeaderType.imageList)
        return undefined;
      const data = value();
      if (data.type === ThemeImageType.key && isBlank(data.imageKey))
        return { kind: 'imageKeyBlank' };
      if (data.type === ThemeImageType.url && isBlank(data.imageUrl))
        return { kind: 'imageUrlBlank' };
      return undefined;
    });
    required(p.itemId);
  });
  readonly group = computed(() => this.form.json);
  private readonly validationMessages = toSignal(
    this.translateService.stream([
      'msg.blank',
      'themeImage.imageKey',
      'themeImage.imageUrl',
    ]),
    {
      initialValue: this.translateService.instant([
        'msg.blank',
        'themeImage.imageKey',
        'themeImage.imageUrl',
      ]),
    }
  );
  readonly formAlerts = computed(() => {
    const messages = this.validationMessages();
    return [
      {
        errorId: 'imageKeyBlank',
        msg: this.translateService.instant('msg.blank', {
          name: messages['themeImage.imageKey'],
        }),
      },
      {
        errorId: 'imageUrlBlank',
        msg: this.translateService.instant('msg.blank', {
          name: messages['themeImage.imageUrl'],
        }),
      },
    ] satisfies FormAlert[];
  });

  constructor() {
    effect(() => {
      const data = this.imageItem();
      if (data) {
        untracked(() =>
          this.form().reset(normalizeThemeItem(data, this.initialFormValue))
        );
      }
    });
  }
}
