import { Component, inject, model } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-button-input-url',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
  ],
  templateUrl: './button-input-url.component.html',
  styleUrl: './button-input-url.component.scss',
})
export class ButtonInputUrlComponent {
  readonly dialogRef = inject(MatDialogRef<ButtonInputUrlComponent>);
  readonly data = inject<string>(MAT_DIALOG_DATA);
  readonly value = model(this.data);

  onNoClick(): void {
    this.dialogRef.close();
  }
}
