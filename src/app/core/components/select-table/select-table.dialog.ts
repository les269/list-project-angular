import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

export interface BaseSelectTableData<O> {
  displayedColumns: string[];
  labels: string[];
  dataSource: O[];
  selectType: 'single' | 'multiple';
  title?: string;
  selected?: O | O[];
  columnFormats?: { [key: string]: (value: any) => string };
  columnSorts?: { [key: string]: boolean };
  enableFilter?: boolean;
  showTitle?: boolean;
}
@Component({
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    TranslateModule,
    CommonModule,
    MatCheckboxModule,
    MatSortModule,
  ],
  selector: 'app-select-dialog',
  templateUrl: 'select-table.dialog.html',
  styleUrl: 'select-table.dialog.scss',
})
export class SelectTableDialog<O, T extends BaseSelectTableData<O>>
  implements OnInit, AfterViewInit
{
  readonly dialogRef = inject(MatDialogRef<SelectTableDialog<O, T>>);
  readonly data = inject<T>(MAT_DIALOG_DATA);
  displayedColumns = this.data.displayedColumns;
  multipleDisplayedColumns: string[] = [];
  labels = this.data.labels;
  dataSource = new MatTableDataSource(this.data.dataSource);
  selectType = this.data.selectType;
  columnFormats = this.data.columnFormats;
  columnSorts = this.data.columnSorts;
  title = this.data.title;
  selected = this.data.selected;
  enableFilter = this.data.enableFilter;
  showTitle = this.data.showTitle === undefined ? true : this.data.showTitle;
  selection = new SelectionModel<O>(true, []);
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    if (this.selectType === 'multiple') {
      this.multipleDisplayedColumns = ['select', ...this.displayedColumns];
      if (this.selected && Array.isArray(this.selected)) {
        this.selection.select(...this.selected);
      }
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
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
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
