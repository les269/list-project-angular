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
}

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
  ],
  selector: 'app-message-box',
  template: `
    <mat-dialog-content>
      {{ data.message | translate }}
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close (click)="no()">
        {{ 'g.no' | translate }}
      </button>
      <button mat-button mat-dialog-close cdkFocusInitial (click)="ok()">
        {{ 'g.ok' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class MessageBoxComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<MessageBoxComponent>);
  readonly data = inject<MessageBoxData>(MAT_DIALOG_DATA);
  constructor() {}

  ngOnInit() {}

  ok() {
    this.dialogRef.close('ok');
  }

  no() {
    this.dialogRef.close();
  }
}
