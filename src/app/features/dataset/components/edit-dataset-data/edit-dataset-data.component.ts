import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { isNotBlank } from '../../../../shared/util/helper';
export interface EditDatasetDataComponentData {
  name?: string;
}
@Component({
  selector: 'app-edit-dataset-data',
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
  templateUrl: './edit-dataset-data.component.html',
  styleUrl: './edit-dataset-data.component.scss',
})
export class EditDatasetDataComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<EditDatasetDataComponent>);
  readonly data = inject<EditDatasetDataComponentData>(MAT_DIALOG_DATA);
  name = '';

  ngOnInit(): void {
    if (isNotBlank(this.data.name)) {
      this.name = this.data.name!;
    }
  }
}
