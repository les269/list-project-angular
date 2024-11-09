import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArrayTextComponent } from '../array-text/array-text.component';
import { FileSizePipe } from '../../../../shared/util/util.pipe';
import { ThemeLabel } from '../../models/theme.model';
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
  @Input({ required: true }) themeLabel!: ThemeLabel;
  @Input({ required: true }) data!: any;
  @Input({ required: true }) isHover: boolean = false;
  @Input({ required: true }) seqKey: string = '';
  @Output() searchChange = new EventEmitter<string>();

  getStringSplit(label: ThemeLabel, view: any): string[] {
    if (isBlank(view[label.byKey])) {
      return [];
    }
    return view[label.byKey]
      .split(label.splitBy)
      .filter((x: string) => isNotBlank(x))
      .map((x: string) => x.trim());
  }

  searchValue(value: string) {
    this.searchChange.emit(value);
  }
}
