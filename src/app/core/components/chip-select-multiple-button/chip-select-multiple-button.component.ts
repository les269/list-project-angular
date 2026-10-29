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
  selector: 'app-chip-select-multiple-button',
  host: { '(focusout)': 'touch.emit()' },
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-select-multiple-button.component.html',
  styleUrl: './chip-select-multiple-button.component.scss',
})
export class ChipSelectMultipleButtonComponent implements FormValueControl<
  any[]
> {
  /** 選項中用來識別資料的欄位，例如 'id'；表單儲存這個欄位的值。 */
  readonly valueKey = input.required<PropertyKey>();
  /** 接收目前選中的物件清單，開啟對話框後回傳新的物件清單；取消時不應發出值。 */
  readonly selectTable =
    input.required<(selected: any[]) => Observable<any[]>>();
  /** 用於將已儲存的 ID 查回顯示資料，可傳入陣列或回傳陣列的 Signal／函式。 */
  readonly options = input.required<any[] | (() => any[])>();
  /** 顯示文字的欄位名稱，例如 'name'，或接收完整物件並回傳文字的函式。 */
  readonly labelKey = input.required<string | ((item: any) => string)>();
  /** 由上層 Signal Forms 傳入必填狀態，本身不會建立驗證規則。 */
  readonly required = input<boolean>(false);
  /** 必填且尚未選取時顯示的文字。 */
  readonly requiredMsg = input<string>('');

  /** 正式表單值只儲存 ID 清單，保留呼叫端原本的 ID 型別與順序。 */
  readonly value = model<any[]>([]);
  readonly touch = output<void>();
  readonly disabled = input(false);

  private readonly resolvedOptions = computed<any[]>(() => {
    const options = this.options();
    return typeof options === 'function' ? options() : options;
  });

  // 暫存對話框選回的物件，補足 options 尚未載入或不包含該項目的情況。
  private readonly dialogSelection = signal<any[]>([]);

  private findOption(id: unknown) {
    const key = this.valueKey();
    const matchesId = (item: any) => String(item[key]) === String(id);
    return (
      this.resolvedOptions().find(matchesId) ??
      this.dialogSelection().find(matchesId)
    );
  }

  /** 依表單 ID 順序取得物件；找不到時保留只有 ID 的物件，避免漏掉已選值。 */
  readonly selectedData = computed(() =>
    this.value().map(id => this.findOption(id) ?? { [this.valueKey()]: id })
  );

  removeChip(obj: any) {
    if (this.disabled()) return;
    const value = obj[this.valueKey()];
    this.touch.emit();
    this.value.update(v => v.filter(item => String(item) !== String(value)));
  }

  displayLabel(item: any): string {
    const id = item[this.valueKey()];
    const option = this.findOption(id);
    if (!option) return String(id);
    const key = this.labelKey();
    const label = typeof key === 'function' ? key(option) : option[key];
    return String(label ?? id);
  }

  openSelectTable() {
    if (this.disabled()) return;
    this.selectTable()(this.selectedData()).subscribe(res => {
      if (this.disabled()) return;
      this.dialogSelection.set(res);
      const idKey = this.valueKey();
      const nextIds = res.map(item => item[idKey]);
      const currentIds = this.value();
      const unchanged =
        currentIds.length === nextIds.length &&
        currentIds.every((id, index) => String(id) === String(nextIds[index]));
      if (!unchanged) this.value.set(nextIds);
      this.touch.emit();
    });
  }
}
