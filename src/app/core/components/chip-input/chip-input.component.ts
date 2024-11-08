import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { isNotBlank } from '../../../shared/util/helper';

@Component({
  selector: 'app-chip-input',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatChipsModule, MatIconModule],
  templateUrl: './chip-input.component.html',
})
export class ChipInputComponent {
  @Input({ required: true }) chipList: string[] = [];
  @Output() chipListChange = new EventEmitter<string[]>();
  @Input() label: string = '';
  @Input() allowDuplicates: boolean = false;
  @Input() type: 'text' | 'color' = 'text';
  @Input() canUpdate: (value: string, index?: number) => boolean = () => true;

  addChip(event: MatChipInputEvent): void {
    const trimmedValue = event.value.trim();
    if (!this.chipList) {
      this.chipList = [];
    }
    if (this.canUpdate && !this.canUpdate(trimmedValue)) {
      return;
    }
    if (isNotBlank(trimmedValue)) {
      if (!this.allowDuplicates && this.chipList.includes(trimmedValue)) {
        event.chipInput.clear();
        return;
      }
      this.chipList.push(trimmedValue);
    }

    event.chipInput.clear();
    this.chipListChange.emit(this.chipList);
  }

  removeChip(index: number): void {
    if (index >= 0) {
      this.chipList.splice(index, 1);
    }
    this.chipListChange.emit(this.chipList);
  }

  editChip(index: number, newValue: string): void {
    const trimmedValue = newValue.trim();
    if (this.canUpdate && !this.canUpdate(trimmedValue)) {
      return;
    }
    if (trimmedValue) {
      const isDuplicate =
        !this.allowDuplicates &&
        this.chipList.includes(trimmedValue) &&
        this.chipList[index] !== trimmedValue;

      if (!isDuplicate) {
        this.chipList[index] = trimmedValue;
      }
    }
    this.chipListChange.emit(this.chipList);
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
}
