import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatTable, MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

export interface BaseSelectTableData<O> {
  displayedColumns: string[];
  labels: string[];
  dataSource: O[];
  selectType: 'single' | 'multiple';
  title?: string;
  selected?: O[];
}
@Component({
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    TranslateModule,
    CommonModule,
    MatCheckboxModule,
  ],
  selector: 'app-select-dialog',
  templateUrl: 'select-table.dialog.html',
  styleUrl: 'select-table.dialog.scss',
})
export class SelectTableDialog<O, T extends BaseSelectTableData<O>>
  implements OnInit
{
  readonly dialogRef = inject(MatDialogRef<SelectTableDialog<O, T>>);
  readonly data = inject<T>(MAT_DIALOG_DATA);
  displayedColumns = this.data.displayedColumns;
  multipleDisplayedColumns: string[] = [];
  labels = this.data.labels;
  dataSource = this.data.dataSource;
  selectType = this.data.selectType;
  title = this.data.title;
  selected = this.data.selected;
  selection = new SelectionModel<O>(true, []);

  ngOnInit(): void {
    if (this.selectType === 'multiple') {
      this.multipleDisplayedColumns = ['select', ...this.displayedColumns];
      if (this.selected) {
        this.selection.select(...this.selected);
      }
    }
  }
  onOk() {
    this.dialogRef.close(this.selection.selected);
  }

  onClickOne(data: O) {
    this.dialogRef.close(data);
  }

  onNoClick() {
    this.dialogRef.close();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource);
  }
}
