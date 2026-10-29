import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { BaseSelectTableData } from '../../model';
import { CustomMatPaginatorIntl } from '../custom-mat-paginatorIntl/custom-mat-paginatorIntl';

@Component({
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    TranslateModule,
    MatCheckboxModule,
    MatSortModule,
    ScrollingModule,
    MatPaginatorModule,
  ],
  selector: 'app-select-dialog',
  templateUrl: 'select-table.dialog.html',
  styleUrl: 'select-table.dialog.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
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
  sort = viewChild(MatSort);
  paginator = viewChild(MatPaginator);

  ngOnInit(): void {
    if (this.selectType === 'multiple') {
      this.multipleDisplayedColumns = ['select', ...this.displayedColumns];
      if (this.selected && Array.isArray(this.selected)) {
        this.selection.select(...this.selected);
        this.dataSource.data = [
          ...this.selected,
          ...this.dataSource.data.filter(
            item => !this.selected!.includes(item)
          ),
        ];
      }
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator();
    this.dataSource.sort = this.sort();
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
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
