import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArrayTextComponent } from '../array-text/array-text.component';
import { FileSizePipe } from '../../../../shared/util/util.pipe';
import { ThemeLabel, ThemeLabelType } from '../../models/theme.model';
import { MatIconModule } from '@angular/material/icon';
import { CopyDirective } from '../../../../shared/util/util.directive';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';

@Component({
  selector: 'app-list-item-value',
  standalone: true,
  imports: [
    CopyDirective,
    CommonModule,
    ArrayTextComponent,
    FileSizePipe,
    MatIconModule,
  ],
  templateUrl: './list-item-value.component.html',
  styleUrl: './list-item-value.component.scss',
})
export class ListItemValueComponent {
  themeLabel = input.required<ThemeLabel>();
  data = input.required<any>();
  isHover = input.required<boolean>();
  seqKey = input.required<string>();
  searchChange = output<string>();
  themeLabelType = ThemeLabelType;

  stringSplitData = computed(() => {
    const label = this.themeLabel();
    const view = this.data();
    const value = view[label.byKey];

    if (isBlank(value)) {
      return [];
    }
    return value
      .split(label.splitBy)
      .filter((x: string) => isNotBlank(x))
      .map((x: string) => x.trim());
  });

  searchValue(value: string) {
    this.searchChange.emit(value);
  }
}
