import { CommonModule } from '@angular/common';
import { Component, computed, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chip-input-color',
  host: { '(focusout)': 'touch.emit()' },

  imports: [CommonModule, MatFormFieldModule, MatChipsModule, MatIconModule],
  templateUrl: './chip-input-color.component.html',
})
export class ChipInputColorComponent implements FormValueControl<string[]> {
  readonly value = model<string[]>([]);
  readonly disabled = input(false);
  readonly touch = output<void>();
  readonly label = input<string>('');
  readonly allowDuplicates = input<boolean>(false);
  readonly canUpdate = input<(value: string, index?: number) => boolean>(
    () => true
  );
  readonly pickerValue = computed(() => {
    const lastColor = this.value().at(-1);
    return this.normalizeColorForPicker(lastColor);
  });

  addChip(event: MatChipInputEvent): void {
    if (this.disabled()) return;
    const trimmedValue = event.value.trim();
    const currentList = this.value();

    if (!this.canUpdate()(trimmedValue)) return;

    if (trimmedValue) {
      if (!this.allowDuplicates() && currentList.includes(trimmedValue)) {
        event.chipInput.clear();
        return;
      }
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

  private normalizeColorForPicker(color?: string): string {
    if (!color) return '#000000';

    const hex = color.trim().replace('#', '');
    if (/^[A-Fa-f0-9]{6}$/.test(hex)) return `#${hex}`;
    if (/^[A-Fa-f0-9]{3}$/.test(hex)) {
      const expanded = hex
        .split('')
        .map(x => x + x)
        .join('');
      return `#${expanded}`;
    }
    if (/^[A-Fa-f0-9]{8}$/.test(hex)) return `#${hex.substring(0, 6)}`;

    return '#000000';
  }
}
