import { Component, inject, signal } from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-add-disk-dialog',

  imports: [MatDialogActions, MatDialogContent, MatDialogTitle, TranslatePipe],
  templateUrl: './add-disk-dialog.component.html',
  styleUrl: './add-disk-dialog.component.scss',
})
export class AddDiskDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AddDiskDialogComponent>);
  readonly selectedDisk = signal('A');

  readonly diskOptions = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.selectedDisk());
  }
}
