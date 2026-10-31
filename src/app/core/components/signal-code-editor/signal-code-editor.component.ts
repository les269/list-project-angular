import { CodeEditor } from '@acrodata/code-editor';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { languages } from '@codemirror/language-data';

/** 以 Signal Forms 綁定編輯器輸入，避免初始化前呼叫第三方 CVA 的方法。 */
@Component({
  selector: 'app-signal-code-editor',
  imports: [CodeEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    code-editor {
      height: 100%;
    }
  `,
  template: `
    <code-editor
      [value]="value()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [language]="language()"
      [languages]="CodeEditorLanguages"
      [indentWithTab]="indentWithTab()"
      (change)="value.set($event)"
      (blur)="touch.emit()" />
  `,
})
export class SignalCodeEditorComponent implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly touch = output<void>();
  readonly language = input('');
  readonly indentWithTab = input(false);
  readonly CodeEditorLanguages = languages;
}
