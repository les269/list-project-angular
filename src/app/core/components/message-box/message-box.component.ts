import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface MessageBoxData {
  message: string;
  onlyOk?: boolean;
}

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    TranslateModule,
    CommonModule,
  ],
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
})
export class MessageBoxComponent {
  readonly dialogRef = inject(MatDialogRef<MessageBoxComponent>);
  readonly data = inject<MessageBoxData>(MAT_DIALOG_DATA);

  ok() {
    this.dialogRef.close('ok');
  }

  no() {
    this.dialogRef.close();
  }
}
