import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, EMPTY, take, finalize } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CopyThemeData, ThemeHeaderType, ThemeHeaderCopy } from '../../models';
import { ThemeService } from '../../services/theme.service';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { FormAlert } from '../../../../core/model';
import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';

@Component({
  selector: 'app-copy-theme',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
    TrimOnBlurDirective,
    FormInvalidsComponent,
  ],
  templateUrl: './copy-theme.component.html',
})
export class CopyThemeComponent {
  //inject
  readonly dialogRef = inject(MatDialogRef<CopyThemeComponent>);
  readonly data = inject<CopyThemeData>(MAT_DIALOG_DATA);
  readonly formBuilder = inject(FormBuilder);
  readonly themeService = inject(ThemeService);
  readonly snackbarService = inject(SnackbarService);
  readonly translateService = inject(TranslateService);
  //enum
  readonly eThemeHeaderType = ThemeHeaderType;
  readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.themeHeader.name, [Validators.required]],
    version: [this.data.themeHeader.version, [Validators.required]],
    type: [this.data.themeHeader.type, [Validators.required]],
    title: [this.data.themeHeader.title, [Validators.required]],
  });

  //signals
  readonly nameControl = this.form.get('name') as FormControl;
  readonly versionControl = this.form.get('version') as FormControl;
  readonly typeControl = this.form.get('type') as FormControl;
  readonly titleControl = this.form.get('title') as FormControl;
  readonly isProcessing = signal(false);

  readonly formAlertsObj = computed(() => {
    const required = {
      errorId: 'required',
      msg: this.translateService.instant('msg.required'),
    };
    return {
      name: [required],
      version: [required],
      title: [required],
    } satisfies Record<string, FormAlert[]>;
  });

  ok() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const target: ThemeHeaderCopy = {
      ...this.data.themeHeader,
      ...formValue,
    };

    this.isProcessing.set(true);
    this.themeService
      .existTheme(target)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openI18N('msg.themeExist');
            return EMPTY;
          }
          return this.themeService.copyTheme({
            source: this.data.themeHeader,
            target,
          });
        }),
        take(1),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe(() => {
        this.dialogRef.close('ok');
      });
  }
}
