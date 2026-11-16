import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

export interface MessageBoxData {
  message: string;
  onlyOk?: boolean;
}

@Component({
  imports: [MatDialogActions, MatDialogContent, TranslatePipe],
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrl: './message-box.component.scss',
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
