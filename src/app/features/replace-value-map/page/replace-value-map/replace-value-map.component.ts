import { AfterViewInit, Component, ViewChild } from '@angular/core';

import { ReplaceValueMapService } from '../../service/replace-value-map.service';
import { ReplaceValueList, ReplaceValueMap } from '../../model';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { filter, switchMap } from 'rxjs';
import {
  downloadJsonFile,
  isBlank,
  isNotBlank,
  isNotNull,
} from '../../../../shared/util/helper';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CustomMatPaginatorIntl } from '../../../../core/components/custom-mat-paginatorIntl/custom-mat-paginatorIntl';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ScrollTopComponent } from '../../../../core/components/scroll-top/scroll-top.component';
import { MessageBoxService } from '../../../../core/services/message-box.service';

@Component({
  selector: 'app-replace-value-map',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    TranslateModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    ScrollTopComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
  templateUrl: './replace-value-map.component.html',
})
export class ReplaceValueMapComponent implements AfterViewInit {
  searchName: string = '';
  displayedColumns = ['match', 'replaceValue', 'other'];
  dataSource = new MatTableDataSource<ReplaceValueList>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  constructor(
    private replaceValueMapService: ReplaceValueMapService,
    private selectTableService: SelectTableService,
    private snackbarService: SnackbarService,
    private matDialog: MatDialog,
    private translateService: TranslateService,
    private messageBoxService: MessageBoxService
  ) {}

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  add() {
    this.dataSource.data = [
      ...this.dataSource.data,
      {
        match: '',
        replaceValue: '',
      },
    ];
  }

  search() {
    if (isBlank(this.searchName)) {
      this.snackbarService.isBlankMessage('replaceValueMap.searchName');
      return;
    }

    this.replaceValueMapService.getByName(this.searchName).subscribe(res => {
      if (res) {
        this.dataSource.data = Object.entries(res.map).flatMap(x => ({
          match: x[0],
          replaceValue: x[1],
        }));
      } else {
        this.dataSource.data = [];
      }
    });
  }

  selectMap() {
    this.replaceValueMapService
      .getNameList()
      .pipe(
        switchMap(res =>
          this.selectTableService.selectSingleReplaceValueMap(res)
        ),
        filter(x => isNotNull(x)),
        switchMap(res => {
          this.searchName = res!.name;
          return this.replaceValueMapService.getByName(res!.name);
        })
      )
      .subscribe(res => {
        if (res) {
          this.dataSource.data = Object.entries(res.map).flatMap(x => ({
            match: x[0],
            replaceValue: x[1],
          }));
        } else {
          this.dataSource.data = [];
        }
      });
  }

  update() {
    if (isBlank(this.searchName)) {
      this.snackbarService.isBlankMessage('replaceValueMap.searchName');
      return;
    }
    const req: ReplaceValueMap = {
      name: this.searchName,
      map: this.dataSource.data.reduce(
        (a, b) => {
          a[b.match] = b.replaceValue;
          return a;
        },
        {} as { [key: string]: string }
      ),
    };

    this.replaceValueMapService.update(req).subscribe(() => {
      this.snackbarService.openI18N('msg.updateSuccess');
    });
  }

  delete() {
    if (isBlank(this.searchName)) {
      this.snackbarService.isBlankMessage('replaceValueMap.searchName');
      return;
    }
    this.replaceValueMapService
      .existMap(this.searchName)
      .pipe(
        filter(res => res),
        switchMap(x => this.messageBoxService.openI18N('msg.sureDeleteMap')),
        filter(res => isNotBlank(res)),
        switchMap(x =>
          this.replaceValueMapService.deleteByName(this.searchName)
        )
      )
      .subscribe(result => {
        this.searchName = '';
        this.dataSource.data = [];
        this.snackbarService.openI18N('msg.deleteSuccess');
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.readJsonFile(file);
      input.value = '';
    }
  }

  readJsonFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        this.dataSource.data = Object.entries(data).flatMap(x => ({
          match: x[0],
          replaceValue: x[1] + '',
        }));
      } catch (error) {
        console.error('Invalid JSON file', error);
      }
    };
    reader.onerror = () => {
      console.error('Error reading file');
    };
    reader.readAsText(file);
  }

  onDelete(element: ReplaceValueList) {
    const index = this.dataSource.data.indexOf(element);
    if (index > -1) {
      this.dataSource.data.splice(index, 1);
      this.dataSource.data = [...this.dataSource.data];
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  export() {
    if (isNotBlank(this.searchName) && this.dataSource.data.length > 0) {
      downloadJsonFile(
        JSON.stringify(
          this.dataSource.data.reduce(
            (a, b) => {
              a[b.match] = b.replaceValue;
              return a;
            },
            {} as { [key: string]: string }
          ),
          null,
          2
        ),
        this.searchName
      );
    }
  }
}
