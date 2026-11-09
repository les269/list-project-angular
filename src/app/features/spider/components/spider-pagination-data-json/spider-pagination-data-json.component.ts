import { JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { SpiderPaginationData } from '../../model';

@Component({
  imports: [
    JsonPipe,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    TranslateModule,
  ],
  selector: 'app-spider-pagination-data-json',
  templateUrl: './spider-pagination-data-json.component.html',
})
export class SpiderPaginationDataJsonComponent {
  readonly record = inject<SpiderPaginationData>(MAT_DIALOG_DATA);
}
