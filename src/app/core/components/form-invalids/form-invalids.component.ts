import { Component, computed, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { FormInvalid } from '../../model/form-invalids.model';

@Component({
  selector: 'app-form-invalids',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './form-invalids.component.html',
})
export class FormInvalidsComponent {
  readonly control =
    input.required<
      () => Pick<FieldState<unknown>, 'invalid' | 'touched' | 'errors'>
    >();
  readonly formAlerts = input<readonly FormInvalid[]>();
  readonly messages = computed(() => {
    const state = this.control()();
    if (!state.invalid() || !state.touched()) return [];
    const errors = state.errors();
    const custom = this.formAlerts();
    // 提供 formAlerts 時保留既有篩選、文案與順序；未提供時自動讀取驗證錯誤。
    if (custom !== undefined) {
      return custom
        .filter(item => errors.some(error => error.kind === item.errorId))
        .map(item => ({ message: item.msg, custom: true }));
    }
    return errors.map(error => ({
      message: error.message || `formField.validation.${error.kind}`,
      custom: false,
    }));
  });
}
