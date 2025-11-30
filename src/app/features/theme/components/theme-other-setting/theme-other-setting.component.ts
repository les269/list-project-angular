import {
  AfterContentInit,
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {
  DEFAULT_ROW_COLOR,
  ThemeHeaderType,
  ThemeOtherSetting,
} from '../../models';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { ThemeTopCustomTableComponent } from '../theme-top-custom-table/theme-top-custom-table.component';

@Component({
  selector: 'app-theme-other-setting',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    TranslateModule,
    MatFormFieldModule,
    MatChipsModule,
    ChipInputComponent,
    ThemeTopCustomTableComponent
],
  templateUrl: './theme-other-setting.component.html',
  styleUrl: './theme-other-setting.component.scss',
})
export class ThemeOtherSettingComponent implements OnChanges {
  @Input({ required: true }) type: ThemeHeaderType = ThemeHeaderType.table;
  @Input({ required: true }) themeOtherSetting!: ThemeOtherSetting;
  @Output() themeOtherSettingChange = new EventEmitter<ThemeOtherSetting>();

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.themeOtherSetting.rowColor) {
      this.themeOtherSetting.rowColor = DEFAULT_ROW_COLOR;
    }
    if (!this.themeOtherSetting.listPageSize) {
      this.themeOtherSetting.listPageSize = 30;
    }
  }

  setDefaultColor() {
    this.themeOtherSetting.rowColor = DEFAULT_ROW_COLOR;
    this.themeOtherSettingChange.emit(this.themeOtherSetting);
  }

  checkColor(value: string) {
    const hexColorPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
    return hexColorPattern.test(value);
  }
}
