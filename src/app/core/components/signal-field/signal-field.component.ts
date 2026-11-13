import { Component, computed, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ChipInputComponent } from '../chip-input/chip-input.component';
import { SignalDateInputComponent } from '../signal-date-input/signal-date-input.component';

import {
  SignalFieldOption,
  SignalFieldType,
} from '../../model/signal-field.model';
import { FormInvalidsComponent } from '../form-invalids/form-invalids.component';

let nextControlId = 0;

@Component({
  selector: 'app-signal-field',
  imports: [
    MatTooltipModule,
    FormField,
    FormInvalidsComponent,
    TranslateModule,
    ChipInputComponent,
    SignalDateInputComponent,
  ],
  templateUrl: './signal-field.component.html',
  styles: `
    :host {
      display: block;
      flex: 1 1 0;
      min-width: 0;
    }
  `,
})
export class SignalFieldComponent<T> {
  // 不同欄位型別的共用顯示邊界，資料與驗證仍由呼叫端的 FieldTree 管理。
  readonly field = input.required<FieldTree<T>>();
  // 依 type 將同一個 FieldTree 交給對應控制項，不複製欄位值。
  readonly textField = computed(
    () => this.field() as unknown as FieldTree<string>
  );
  readonly numberField = computed(
    () => this.field() as unknown as FieldTree<number>
  );
  readonly checkboxField = computed(
    () => this.field() as unknown as FieldTree<boolean>
  );
  readonly chipsField = computed(
    () => this.field() as unknown as FieldTree<string[]>
  );
  readonly dateField = computed(
    () => this.field() as unknown as FieldTree<Date>
  );
  readonly label = input('');
  readonly hint = input('');
  readonly describedBy = input('');
  readonly inputEvent = output<Event>();
  readonly changeEvent = output<Event>();
  readonly trim = input(false);
  readonly type = input<SignalFieldType>(SignalFieldType.TEXT);
  readonly fieldType = SignalFieldType;
  readonly inline = input(false);
  readonly pickerOnly = input(true);
  readonly options = input<readonly SignalFieldOption[]>([]);
  readonly emptyOption = input('');
  readonly controlId = `signal-field-${++nextControlId}`;
  readonly invalid = computed(
    () => this.field()().invalid() && this.field()().touched()
  );
  trimText() {
    if (!this.trim() || this.textField()().disabled()) return;
    this.textField()().value.update(value => value.trim());
  }
}
