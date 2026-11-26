import { Component, computed, input, linkedSignal, model } from '@angular/core';
import { form, FormField, validate } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';

@Component({
  selector: 'app-json-data-field',
  imports: [FormField, TranslatePipe, SignalCodeEditorComponent],
  template: `
    <div role="group" [attr.aria-label]="label()">
      <div class="field-header">
        <span [class.require]="requiredIndicator()">{{ label() }}</span>
        <button
          type="button"
          class="dialog-button"
          (click)="formatJson()"
          [disabled]="invalid()">
          {{ 'g.format' | translate }}
        </button>
      </div>
      <app-signal-code-editor
        [formField]="editorForm"
        language="json"
        (valueChange)="onDraftChange($event)"
        [indentWithTab]="true" />
      @if (error(); as error) {
        <p class="error-msg" role="alert">
          {{ error.message | translate }} {{ error.detail }}
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--app-space-1);
    }
    app-signal-code-editor {
      height: 120px;
      border: 1px solid var(--app-border);
    }
    .error-msg {
      margin-block: var(--app-space-1);
      color: var(--app-error, #b42318);
    }
    button {
      padding: var(--app-space-1) var(--app-space-2);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-sm);
      color: var(--app-text-primary);
      background: var(--app-surface);
    }
  `,
})
export class JsonDataFieldComponent {
  readonly label = input.required<string>();
  readonly requiredIndicator = input(false);
  readonly kind = input.required<'object' | 'array'>();
  readonly resetVersion = input(0);
  readonly value = model<unknown>();
  // 草稿可保留未完成的 JSON，正式值只接受解析成功且根型別正確的資料。
  readonly draft = linkedSignal<{ value: unknown; reset: number }, string>({
    source: () => ({ value: this.value(), reset: this.resetVersion() }),
    computation: (source, previous) => {
      if (previous && source.reset === previous.source.reset) {
        try {
          if (
            JSON.stringify(JSON.parse(previous.value)) ===
            JSON.stringify(source.value)
          )
            return previous.value;
        } catch {
          // 外部載入新資料時，以新資料取代無效草稿。
        }
      }
      return JSON.stringify(source.value, null, 2) ?? '';
    },
  });
  readonly parsed = computed(() => {
    try {
      const value: unknown = JSON.parse(this.draft());
      const matches =
        this.kind() === 'array'
          ? Array.isArray(value)
          : value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value);
      return matches
        ? { value, error: undefined }
        : {
            value: undefined,
            error: {
              message:
                this.kind() === 'array'
                  ? 'dataset.jsonArrayRequired'
                  : 'dataset.jsonObjectRequired',
              detail: '',
            },
          };
    } catch (error) {
      return {
        value: undefined,
        error: {
          message: 'msg.invalidJson',
          detail: error instanceof Error ? error.message : '',
        },
      };
    }
  });
  readonly error = computed(() => this.parsed().error);
  readonly invalid = computed(() => !!this.error());
  readonly editorForm = form(this.draft, p => {
    validate(p, () =>
      this.error()
        ? { kind: 'json', message: this.error()!.message }
        : undefined
    );
  });

  onDraftChange(text: string) {
    this.draft.set(text);
    const parsed = this.parsed();
    if (!parsed.error) this.value.set(parsed.value);
  }

  formatJson() {
    if (this.invalid()) return;
    this.draft.set(JSON.stringify(this.parsed().value, null, 2));
  }
}
