import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CopyThemeData, ThemeHeaderCopy, ThemeHeaderType } from '../models';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import { EMPTY, switchMap } from 'rxjs';
import { isBlank } from '../../../shared/util/helper';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  standalone: true,
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
  selector: 'app-copy-theme',
  template: `
    <h2 mat-dialog-title>{{ 'title.copyTheme' | translate }}</h2>
    <mat-dialog-content>
      <div class="mb-3">
        <label for="name" class="form-label">{{
          'themeHeader.name' | translate
        }}</label>
        <input
          type="text"
          class="form-control"
          [(ngModel)]="target.name"
          id="name"
          name="name"
          #name="ngModel" />
        </div>
        <div class="mb-3">
          <label for="version" class="form-label">{{
            'themeHeader.version' | translate
          }}</label>
          <input
            type="text"
            class="form-control"
            [(ngModel)]="target.version"
            id="version"
            name="version" />
          </div>
          <div class="mb-3">
            <label class="form-label" for="type">{{
              'themeHeader.type' | translate
            }}</label>
            <select
              class="form-control form-select"
              [(ngModel)]="target.type"
              name="type">
              @for (type of eThemeHeaderType | keyvalue; track type) {
                <option
                  [ngValue]="type.key">
                  {{ 'themeHeader.' + type.key | translate }}
                </option>
              }
            </select>
          </div>
          <div class="mb-3">
            <label for="title" class="form-label">{{
              'themeHeader.title' | translate
            }}</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="target.title"
              id="title"
              name="title" />
            </div>
          </mat-dialog-content>
          <mat-dialog-actions>
            <button mat-button mat-dialog-close>
              {{ 'g.no' | translate }}
            </button>
            <button mat-button cdkFocusInitial (click)="ok()">
              {{ 'g.ok' | translate }}
            </button>
          </mat-dialog-actions>
    `,
})
export class CopyThemeComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<CopyThemeComponent>);
  readonly data = inject<CopyThemeData>(MAT_DIALOG_DATA);
  readonly eThemeHeaderType = ThemeHeaderType;
  target: ThemeHeaderCopy = {
    name: '',
    version: '',
    title: '',
    type: ThemeHeaderType.imageList,
    seq: 0,
  };
  constructor(
    private themeService: ThemeService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit() {
    this.target = { ...this.data.themeHeader };
  }

  ok() {
    if (isBlank(this.target.name)) {
      this.snackbarService.isBlankMessage('themeHeader.name');
      return;
    }
    if (isBlank(this.target.version)) {
      this.snackbarService.isBlankMessage('themeHeader.version');
      return;
    }
    if (isBlank(this.target.title)) {
      this.snackbarService.isBlankMessage('themeHeader.title');
      return;
    }
    this.target = {
      ...this.target,
      name: this.target.name.trim(),
      version: this.target.version.trim(),
      title: this.target.title.trim(),
    };
    this.themeService
      .existTheme(this.target)
      .pipe(
        switchMap(res => {
          if (res) {
            this.snackbarService.openByI18N('msg.themeExist');
            return EMPTY;
          }
          return this.themeService.copyTheme({
            source: this.data.themeHeader,
            target: this.target,
          });
        })
      )
      .subscribe(() => {
        this.dialogRef.close('ok');
      });
  }
}
