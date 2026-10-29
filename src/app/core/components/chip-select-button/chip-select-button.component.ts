import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chip-select-button',
  host: { '(focusout)': 'touch.emit()' },
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-select-button.component.html',
  styleUrl: './chip-select-button.component.scss',
})
export class ChipSelectButtonComponent implements FormValueControl<string> {
  /** 選項中用來識別資料的欄位，例如 'id'；表單儲存這個欄位的值。 */
  readonly valueKey = input.required<PropertyKey>();
  /** 開啟單選對話框，回傳使用者選中的完整物件；取消時不應發出值。 */
  readonly selectTable = input.required<() => Observable<any>>();
  /** 用於將已儲存的 ID 查回顯示資料，可傳入陣列或回傳陣列的 Signal／函式。 */
  readonly options = input.required<any[] | (() => any[])>();
  /** 顯示文字的欄位名稱，例如 'name'，或接收完整物件並回傳文字的函式。 */
  readonly labelKey = input.required<((item: any) => string) | string>();
  /** 由上層 Signal Forms 傳入必填狀態，本身不會建立驗證規則。 */
  readonly required = input<boolean>(false);
  /** 必填且尚未選取時顯示的文字。 */
  readonly requiredMsg = input<string>('');

  /** 正式表單值只儲存 ID 字串，不儲存整個選項物件。 */
  readonly value = model('');
  readonly touch = output<void>();
  readonly disabled = input(false);

  private readonly resolvedOptions = computed<any[]>(() => {
    const opts = this.options();
    return typeof opts === 'function' ? opts() : opts;
  });

  // 暫存對話框選回的物件，補足 options 尚未載入或不包含該項目的情況。
  private readonly dialogSelection = signal<any>(undefined);

  /** 根據正式表單的 ID 取得顯示資料；優先使用 options。 */
  readonly selectedData = computed(() => {
    const id = this.value();
    if (id === '') return undefined;
    const key = this.valueKey();
    const option = this.resolvedOptions().find(
      item => String(item[key]) === id
    );
    if (option) return option;
    const selected = this.dialogSelection();
    return selected && String(selected[key]) === id ? selected : undefined;
  });

  removeChip() {
    if (this.disabled()) return;
    this.value.set('');
    this.touch.emit();
  }

  displayLabel(): string {
    const item = this.selectedData();
    if (!item) return this.value();
    const key = this.labelKey();
    const label = typeof key === 'function' ? key(item) : item[key];
    return String(label ?? this.value());
  }

  openSelectTable() {
    if (this.disabled()) return;
    this.selectTable()().subscribe(res => {
      if (this.disabled()) return;
      this.dialogSelection.set(res);
      const id = String(res[this.valueKey()]);
      this.value.set(id);
      this.touch.emit();
    });
  }
}
