import {
  Component,
  computed,
  input,
  model,
  output,
  viewChild,
  ElementRef,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'app-signal-date-input',
  templateUrl: './signal-date-input.component.html',
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class SignalDateInputComponent implements FormValueControl<Date> {
  private readonly picker =
    viewChild.required<ElementRef<HTMLInputElement>>('picker');
  readonly value = model(new Date());
  readonly disabled = input(false);
  readonly touch = output<void>();
  readonly controlId = input('');
  readonly label = input('');
  readonly showError = input(false);
  readonly pickerOnly = input(true);
  readonly localValue = computed(() => {
    const date = new Date(this.value());
    if (!Number.isFinite(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19);
  });

  focus(options?: FocusOptions) {
    this.picker().nativeElement.focus(options);
  }

  change(value: string) {
    if (this.disabled()) return;
    this.value.set(new Date(value));
    this.touch.emit();
  }

  keydown(event: KeyboardEvent, input: HTMLInputElement) {
    if (!this.pickerOnly() || event.key === 'Tab' || event.key === 'Escape')
      return;
    event.preventDefault();
    if (event.key === 'Enter' || event.key === ' ') input.showPicker();
  }
}
