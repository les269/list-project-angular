import { Component, inject, model, OnInit } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


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
    TranslateModule
],
  selector: 'app-button-input-url',
  template: `
    <h2 mat-dialog-title>{{ 'title.inputUrl' | translate }}</h2>
    <mat-dialog-content>
      <div class="my-1">
        <textarea class="form-control" [(ngModel)]="value"></textarea>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="value.set('')">
        {{ 'g.clear' | translate }}
      </button>
      <button mat-button (click)="onNoClick()">
        {{ 'g.no' | translate }}
      </button>
      <button mat-button cdkFocusInitial [mat-dialog-close]="value()">
        {{ 'g.ok' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ButtonInputUrlDialog {
  readonly dialogRef = inject(MatDialogRef<ButtonInputUrlDialog>);
  readonly data = inject<string>(MAT_DIALOG_DATA);
  readonly value = model(this.data);

  onNoClick(): void {
    this.dialogRef.close();
  }
}
