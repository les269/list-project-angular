import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { HeadersMapType } from '../../model';
import { HeadersTableComponent } from '../headers-table/headers-table.component';
import { MatIconModule } from '@angular/material/icon';

export interface HeadersTableDialogData {
  refId: string;
  mapType: HeadersMapType;
}

@Component({
  selector: 'app-headers-table-dialog',
  standalone: true,
  imports: [
    TranslateModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    HeadersTableComponent,
    MatIconModule,
  ],
  templateUrl: './headers-table-dialog.component.html',
})
export class HeadersTableDialogComponent {
  readonly dialogRef = inject(MatDialogRef<HeadersTableDialogComponent>);
  readonly data = inject<HeadersTableDialogData>(MAT_DIALOG_DATA);

  onClose() {
    this.dialogRef.close();
  }
}
