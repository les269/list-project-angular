import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { ThemeService } from '../../services/theme.service';
import { ThemeHeader, ThemeHeaderType } from '../../models';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { ThemeHiddenService } from '../../services';
import {
  getHeaderId,
  getHeaderIdByHeader,
} from '../../../../shared/util/helper';
import { LayoutStore } from '../../../../core/stores/layout.store';

@Component({
  selector: 'app-theme-visible',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    TranslateModule,
    MatIconModule,
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
  ],
  templateUrl: './theme-visible.component.html',
  styleUrl: './theme-visible.component.scss',
})
export class ThemeVisibleComponent {
  readonly dialogRef = inject(MatDialogRef<ThemeVisibleComponent>);
  readonly themeService = inject(ThemeService);
  readonly themeHiddenService = inject(ThemeHiddenService);
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
