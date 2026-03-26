import {
  Component,
  EventEmitter,
  forwardRef,
  input,
  Input,
  model,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-chip-input',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatChipsModule, MatIconModule],
  templateUrl: './chip-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipInputComponent),
      multi: true,
    },
  ],
})
export class ChipInputComponent {
  readonly chipList = model<string[]>([]);
  readonly label = input<string>('');
  readonly allowDuplicates = input<boolean>(false);
  readonly type = input<'text' | 'color'>('text');
  readonly canUpdate = input<(value: string, index?: number) => boolean>(
    () => true
  );

  addChip(event: MatChipInputEvent): void {
    const trimmedValue = event.value.trim();
    const currentList = this.chipList(); // 取得目前的 Signal 值

    if (this.canUpdate() && !this.canUpdate()(trimmedValue)) return;

    if (trimmedValue) {
      if (!this.allowDuplicates() && currentList.includes(trimmedValue)) {
        event.chipInput.clear();
        return;
      }
      // 更新 Signal：使用 set/update 觸發通知
      this.chipList.update(list => [...list!, trimmedValue]);
    }
    event.chipInput.clear();
    this.onChange(this.chipList());
  }

  removeChip(index: number): void {
    this.chipList.update(list => {
      const newList = [...list];
      newList.splice(index, 1);
      return newList;
    });
    this.onChange(this.chipList());
  }

  editChip(index: number, newValue: string): void {
    const trimmedValue = newValue.trim();
    // 1. 檢查 canUpdate (注意 canUpdate 是 input signal)
    if (this.canUpdate() && !this.canUpdate()(trimmedValue)) {
      return;
    }

    if (trimmedValue) {
      const currentList = this.chipList(); // 取得當前值

      // 2. 檢查重複
      const isDuplicate =
        !this.allowDuplicates() &&
        currentList.includes(trimmedValue) &&
        currentList[index] !== trimmedValue;
      if (!isDuplicate) {
        // 3. 關鍵：使用 update 並透過展開運算符 [...] 產生新陣列
        this.chipList.update(list => {
          const newList = [...list]; // 複製一份
          newList[index] = trimmedValue; // 修改新陣列
          return newList; // 回傳新陣列觸發通知
        });
        this.onChange(this.chipList());
      }
    }
  }

  getLuminance(hex: string): number {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(x => x + x)
        .join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const a = [r, g, b].map(function (v) {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  // ControlValueAccessor 必須實作的四個方法
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string[]): void {
    this.chipList.set(value || []); // 同步到你原本的變數
    this.onChange(this.chipList());
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    /* 處理禁用狀態 */
  }

  // 在你原本的 addChip / removeChip 最後呼叫：
  // this.onChange(this.chipList);
}
