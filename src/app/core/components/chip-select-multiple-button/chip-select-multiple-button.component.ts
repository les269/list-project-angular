import { Component, effect, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chip-select-multiple-button',
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-select-multiple-button.component.html',
  styleUrl: './chip-select-multiple-button.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipSelectMultipleButtonComponent),
      multi: true,
    },
  ],
})
export class ChipSelectMultipleButtonComponent implements ControlValueAccessor {
  readonly valueKey = input.required<string | number | symbol>();
  readonly selectTable =
    input.required<(selected: any[]) => Observable<any[]>>();
  readonly options = input.required<any[]>();
  readonly labelKey = input.required<string | ((item: any) => string)>();
  readonly required = input<boolean>(false);
  readonly requiredMsg = input<string>('');

  readonly values = signal<any[]>([]);
  readonly disabled = signal(false);
  readonly selectedData = signal<any[]>([]);

  constructor() {
    // options 是 async 載入，當 options 有資料時補找 selectedData
    effect(() => {
      const opts = this.options();
      const vals = this.values();
      if (opts.length === 0 || vals.length === 0) return;
      if (this.selectedData().length > 0) return;
      const found = opts.filter(opt => vals.includes(opt[this.valueKey()]));
      if (found.length > 0) this.selectedData.set(found);
    });
  }

  removeChip(obj: any) {
    const key = this.valueKey();
    const value = obj[this.valueKey()];
    this.values.update(v => v.filter(item => item !== value));
    this.selectedData.update(d => d.filter(item => item[key] !== value));

    this.onChange(this.values());
  }

  displayLabel(item: any): string {
    const key = this.labelKey();
    if (typeof key === 'function') return key(item);
    if (key) return String(item[key]);
    return String(item[this.valueKey()]);
  }

  openSelectTable() {
    this.selectTable()(this.selectedData()).subscribe(res => {
      const idKey = this.valueKey();
      const nextIds = res.map(item => item[idKey]) as any[];
      this.values.set(nextIds);
      this.selectedData.set(res);
      this.onChange(nextIds);
    });
  }
  // ControlValueAccessor 介面實作
  onChange: any = () => {};
  onTouched: any = () => {};
  writeValue(val: any): void {
    this.selectedData.set([]);
    this.values.set(val ?? []);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
