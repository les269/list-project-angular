import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
} from '@angular/core';
import {
  ThemeHeaderType,
  ThemeImage,
  ThemeImageItem,
  ThemeImageType,
  ThemeItemType,
} from '../../models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { isBlank } from '../../../../shared/util/helper';
import { FormAlertsComponent } from '../../../../core/components/form-alerts/form-alerts.component';
import { FormAlert } from '../../../../core/model';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';

@Component({
  selector: 'app-theme-image',
  imports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    FormAlertsComponent,
    ThemeItemManageComponent,
    TrimOnBlurDirective,
  ],
  templateUrl: './theme-image.component.html',
})
export class ThemeImageComponent implements OnInit {
  //inject
  readonly translateService = inject(TranslateService);
  readonly fb = inject(FormBuilder);
  //input
  readonly headerId = input<string>();
  readonly imageItem = input<ThemeImageItem>();
  readonly oldData = input<ThemeImage>();
  readonly themeHeaderType = input<ThemeHeaderType>();
  //enum
  readonly eThemeImageType = ThemeImageType;
  readonly eThemeItemType = ThemeItemType;
  //signals
  readonly defaultBinding = computed(() => !!this.imageItem());
  readonly form = this.fb.group({
    itemId: ['', [Validators.required]],
    description: [''],
    json: this.fb.group({
      imageKey: [''],
      imageUrl: [''],
      type: [ThemeImageType.key],
    }),
  });
  readonly group = computed(() => this.form.get('json') as FormGroup);
  readonly formAlerts = computed(
    () =>
      [
        {
          errorId: 'imageKeyBlank',
          msg: this.translateService.instant('msg.blank', {
            name: this.translateService.instant('themeImage.imageKey'),
          }),
        },
        {
          errorId: 'imageUrlBlank',
          msg: this.translateService.instant('msg.blank', {
            name: this.translateService.instant('themeImage.imageUrl'),
          }),
        },
      ] satisfies FormAlert[]
  );

  constructor() {
    effect(() => {
      const data = this.imageItem();
      const oldData = this.oldData();
      if (data) {
        return this.form.patchValue(data);
      } else if (oldData) {
        return this.group().patchValue(oldData);
      }
    });
  }

  ngOnInit(): void {
    const group = this.group();
    group.setValidators(this.blankValidator());
    group.updateValueAndValidity();
  }

  blankValidator() {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      if (this.themeHeaderType() !== ThemeHeaderType.imageList) {
        return null;
      }
      const type = ctrl.get('type')?.value;
      if (type === ThemeImageType.key && isBlank(ctrl.get('imageKey')?.value)) {
        return { imageKeyBlank: true };
      }
      if (type === ThemeImageType.url && isBlank(ctrl.get('imageUrl')?.value)) {
        return { imageUrlBlank: true };
      }
      return null;
    };
  }
}
