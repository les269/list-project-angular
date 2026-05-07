import { Component, computed, forwardRef, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-chip-input-color',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatChipsModule, MatIconModule],
  templateUrl: './chip-input-color.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipInputColorComponent),
      multi: true,
    },
  ],
})
export class ChipInputColorComponent {
  readonly chipList = model<string[]>([]);
  readonly label = input<string>('');
  readonly allowDuplicates = input<boolean>(false);
  readonly canUpdate = input<(value: string, index?: number) => boolean>(
    () => true
  );
  readonly pickerValue = computed(() => {
    const lastColor = this.chipList().at(-1);
    return this.normalizeColorForPicker(lastColor);
  });

  addChip(event: MatChipInputEvent): void {
    const trimmedValue = event.value.trim();
    const currentList = this.chipList();

    if (this.canUpdate() && !this.canUpdate()(trimmedValue)) return;

    if (trimmedValue) {
      if (!this.allowDuplicates() && currentList.includes(trimmedValue)) {
        event.chipInput.clear();
        return;
      }
      this.chipList.update(list => [...list, trimmedValue]);
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
    if (this.canUpdate() && !this.canUpdate()(trimmedValue)) {
      return;
    }

    if (trimmedValue) {
      const currentList = this.chipList();
      const isDuplicate =
        !this.allowDuplicates() &&
        currentList.includes(trimmedValue) &&
        currentList[index] !== trimmedValue;
      if (!isDuplicate) {
        this.chipList.update(list => {
          const newList = [...list];
          newList[index] = trimmedValue;
          return newList;
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

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string[]): void {
    this.chipList.set(value || []);
    this.onChange(this.chipList());
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // handle disabled state if needed
  }
}
