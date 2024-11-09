import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ThemeLabel } from '../../models';
import { CopyDirective } from '../../../../shared/util/util.directive';

@Component({
  selector: 'app-array-text',
  standalone: true,
  imports: [CommonModule, MatIconModule, CopyDirective],
  templateUrl: './array-text.component.html',
  styleUrl: './array-text.component.scss',
})
export class ArrayTextComponent {
  @Input({ required: true }) themeLabel!: ThemeLabel;
  @Input({ required: true }) array: string[] = [];
  @Input({ required: true }) isHover: boolean = false;
  @Output() searchChange = new EventEmitter<string>();

  sortArrayText(arr: any) {
    if (Array.isArray(arr)) {
      return arr.sort((a, b) => (a > b ? 1 : -1));
    }
    return arr;
  }

  searchValue(value: string) {
    this.searchChange.emit(value);
  }
}
