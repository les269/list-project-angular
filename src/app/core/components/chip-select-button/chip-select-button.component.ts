import {
  Component,
  computed,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chip-select-button',
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-select-button.component.html',
  styleUrl: './chip-select-button.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipSelectButtonComponent),
      multi: true,
    },
  ],
})
export class ChipSelectButtonComponent implements ControlValueAccessor {
  readonly valueKey = input.required<any>();
  readonly selectTable = input.required<() => Observable<any>>();
  /** 可傳入純陣列 `any[]` 或 Signal `() => any[]`，元件內部自動解析 */
  readonly options = input.required<any[] | (() => any[])>();
  readonly labelKey = input.required<((item: any) => string) | string>();
  readonly required = input<boolean>(false);
  readonly requiredMsg = input<string>('');

  readonly value = signal('');
  readonly disabled = signal(false);
  readonly selectedData = signal<any | null>(null);

  private readonly resolvedOptions = computed<any[]>(() => {
    const opts = this.options();
    return typeof opts === 'function' ? opts() : opts;
  });

  constructor() {
    // options 是 async 載入，當 options 有資料時補找 selectedData
    effect(() => {
      const opts = this.resolvedOptions();
      const val = this.value();
      if (opts.length === 0 || !val || this.selectedData()) return;
      const found = opts.find(
        opt => String(opt[this.valueKey()]) === String(val)
      );
      if (found) this.selectedData.set(found);
    });
  }

  removeChip() {
    this.value.set('');
    this.selectedData.set(null);
    this.onChange('');
  }

  displayLabel() {
    const item = this.selectedData();
    if (!item) return this.value(); // 如果找不到物件，保底顯示 ID

    const key = this.labelKey();
    if (typeof key === 'function') return key(item);
    if (key) return item[key];

    return this.value();
  }

  openSelectTable() {
    this.selectTable()().subscribe(res => {
      const id = String(res[this.valueKey()]);
      this.value.set(id);
      this.selectedData.set(res);
      this.onChange(id);
    });
  }

  // ControlValueAccessor 介面實作
  onChange: any = () => {};
  onTouched: any = () => {};
  writeValue(val: any): void {
    // 清除舊的 selectedData，讓 effect 重新查找（兼容 options 已載入或尚未載入兩種情況）
    this.selectedData.set(null);
    this.value.set(val || '');
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
