import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap, EMPTY, take, finalize } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank } from '../../../../shared/util/helper';
import { CopyThemeData, ThemeHeaderType, ThemeHeaderCopy } from '../../models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-copy-theme',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
  ],
  templateUrl: './copy-theme.component.html',
  styleUrl: './copy-theme.component.scss',
})
export class CopyThemeComponent {
  readonly dialogRef = inject(MatDialogRef<CopyThemeComponent>);
  readonly data = inject<CopyThemeData>(MAT_DIALOG_DATA);
  readonly eThemeHeaderType = ThemeHeaderType;
  readonly target = signal<ThemeHeaderCopy>({
    ...this.data.themeHeader,
  });
  private readonly themeService = inject(ThemeService);
  private readonly snackbarService = inject(SnackbarService);
  isProcessing = false;

  ok() {
    const { name, version, title } = this.target();
    if (isBlank(name)) {
      this.snackbarService.isBlankMessage('themeHeader.name');
      return;
    }
    if (isBlank(version)) {
      this.snackbarService.isBlankMessage('themeHeader.version');
      return;
    }
    if (isBlank(title)) {
      this.snackbarService.isBlankMessage('themeHeader.title');
      return;
    }
    this.target.update(current => ({
      ...current,
      name: name.trim(),
      version: version.trim(),
      title: title.trim(),
    }));
    this.isProcessing = true;
    this.themeService
      .existTheme(this.target())
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openI18N('msg.themeExist');
            return EMPTY;
          }
          return this.themeService.copyTheme({
            source: this.data.themeHeader,
            target: this.target(),
          });
        }),
        take(1),
        finalize(() => (this.isProcessing = false))
      )
      .subscribe(() => {
        this.dialogRef.close('ok');
      });
  }
}
