import { CodeEditor } from '@acrodata/code-editor';
import {
  ChangeDetectionStrategy,
  afterRenderEffect,
  Component,
  input,
  model,
  output,
  viewChild,
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
  private readonly editor = viewChild.required(CodeEditor);

  constructor() {
    afterRenderEffect(() => {
      const editor = this.editor();
      const value = this.value();
      // 使用者輸入已在 Editor 內生效，只有外部值不同時才替換文件，保留游標與復原紀錄。
      if (editor.view.state.doc.toString() !== value) {
        editor.setValue(value);
      }
    });
  }
}
