import { CommonModule } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chip-input',
  host: { '(focusout)': 'touch.emit()' },

  imports: [CommonModule, MatFormFieldModule, MatChipsModule, MatIconModule],
  templateUrl: './chip-input.component.html',
})
export class ChipInputComponent implements FormValueControl<string[]> {
  readonly value = model<string[]>([]);
  readonly disabled = input(false);
  readonly touch = output<void>();
  readonly label = input<string>('');
  readonly allowDuplicates = input<boolean>(false);
  readonly canUpdate = input<(value: string, index?: number) => boolean>(
    () => true
  );

  addChip(event: MatChipInputEvent): void {
    if (this.disabled()) return;
    const trimmedValue = event.value.trim();
    const currentList = this.value(); // 取得目前的 Signal 值

    if (!this.canUpdate()(trimmedValue)) return;

    if (trimmedValue) {
      if (!this.allowDuplicates() && currentList.includes(trimmedValue)) {
        event.chipInput.clear();
        return;
      }
      // 更新 Signal：使用 set/update 觸發通知
      this.touch.emit();
      this.value.update(list => [...list, trimmedValue]);
    }
    event.chipInput.clear();
  }

  removeChip(index: number): void {
    if (this.disabled()) return;
    this.touch.emit();
    this.value.update(list => {
      const newList = [...list];
      newList.splice(index, 1);
      return newList;
    });
  }

  editChip(index: number, newValue: string): void {
    if (this.disabled()) return;
    const trimmedValue = newValue.trim();
    const currentList = this.value();
    if (index < 0 || index >= currentList.length || !trimmedValue) return;
    if (currentList[index] === trimmedValue) {
      this.touch.emit();
      return;
    }
    if (!this.canUpdate()(trimmedValue, index)) return;
    if (!this.allowDuplicates() && currentList.includes(trimmedValue)) return;

    this.touch.emit();
    this.value.update(list =>
      list.map((item, itemIndex) => (itemIndex === index ? trimmedValue : item))
    );
  }
}
