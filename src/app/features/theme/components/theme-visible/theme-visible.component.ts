import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeHeader, ThemeHeaderType } from '../../models';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { getHeaderIdByHeader } from '../../../../shared/util/helper';
import { LayoutStore } from '../../../../core/stores/layout.store';

@Component({
  selector: 'app-theme-visible',

  imports: [
    CommonModule,
    TranslatePipe,
    MatIconModule,
    MatDialogTitle,
    MatDialogContent,
  ],
  templateUrl: './theme-visible.component.html',
  styleUrl: './theme-visible.component.scss',
})
export class ThemeVisibleComponent {
  readonly dialogRef = inject(MatDialogRef<ThemeVisibleComponent>);
  readonly layoutStore = inject(LayoutStore);
  readonly eThemeHeaderType = ThemeHeaderType;
  readonly list = computed(() => this.layoutStore.list());
  readonly getHeaderIdByHeader = getHeaderIdByHeader;

  onNoClick(): void {
    this.dialogRef.close();
  }

  changeVisible(item: ThemeHeader) {
    this.layoutStore.changeHidden(getHeaderIdByHeader(item));
  }
}
