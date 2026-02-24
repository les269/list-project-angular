import { Component, inject, OnInit } from '@angular/core';
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
import { selectLayoutList } from '../../../../shared/state/layout.selectors';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs';

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
  readonly store = inject(Store);
  readonly themeService = inject(ThemeService);
  eThemeHeaderType = ThemeHeaderType;
  list = rxResource({
    stream: () =>
      this.themeService
        .getAllThemeMapType()
        .pipe(tap(res => this.themeService.updateThemeStore(res))),
    defaultValue: {
      [ThemeHeaderType.imageList]: [],
      [ThemeHeaderType.table]: [],
    },
  });

  onNoClick(): void {
    this.dialogRef.close();
  }

  changeVisible(item: ThemeHeader) {
    const req = {
      ...item,
      themeOtherSetting: {
        ...item.themeOtherSetting,
        themeVisible: !item.themeOtherSetting.themeVisible,
      },
    };
    this.themeService.updateTheme(req).subscribe(() => {
      this.list.reload();
    });
  }
}
