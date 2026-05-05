import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { CookieListMapType } from '../../model';
import { CookieTableComponent } from '../cookie-table/cookie-table.component';
import { MatIconModule } from '@angular/material/icon';

export interface CookieTableDialogData {
  refId: string;
  mapType: CookieListMapType;
}

@Component({
  selector: 'app-cookie-table-dialog',
  standalone: true,
  imports: [
    TranslateModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    CookieTableComponent,
    MatIconModule,
  ],
  templateUrl: './cookie-table-dialog.component.html',
})
export class CookieTableDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CookieTableDialogComponent>);
  readonly data = inject<CookieTableDialogData>(MAT_DIALOG_DATA);

  onClose() {
    this.dialogRef.close();
  }
}
