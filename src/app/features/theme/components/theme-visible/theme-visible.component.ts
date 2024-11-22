import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { ThemeService } from '../../services/theme.service';
import { ThemeHeader, ThemeHeaderType } from '../../models';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { switchMap } from 'rxjs';

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
export class ThemeVisibleComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<ThemeVisibleComponent>);
  eThemeHeaderType = ThemeHeaderType;
  list: {
    [key in ThemeHeaderType]: ThemeHeader[];
  } = {
    [ThemeHeaderType.imageList]: [],
    [ThemeHeaderType.table]: [],
  };

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.getAllTheme().subscribe(res => {
      this.list = {
        [ThemeHeaderType.imageList]: res
          .filter(x => x.type === ThemeHeaderType.imageList)
          .sort((a, b) => (a.seq > b.seq ? 1 : -1)),
        [ThemeHeaderType.table]: res
          .filter(x => x.type === ThemeHeaderType.table)
          .sort((a, b) => (a.seq > b.seq ? 1 : -1)),
      };
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  changeVisible(item: ThemeHeader) {
    item.themeOtherSetting.themeVisible = !item.themeOtherSetting.themeVisible;
    this.themeService.updateTheme(item).subscribe(() => {
      this.themeService.updateAllTheme();
    });
  }
}
