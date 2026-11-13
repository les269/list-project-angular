import { Component, effect, inject, viewChild } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { CustomMatPaginatorIntl } from '../../../../core/components/custom-mat-paginatorIntl/custom-mat-paginatorIntl';
import { ScrollTopComponent } from '../../../../core/components/scroll-top/scroll-top.component';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  downloadJsonFile,
  isBlank,
  isNotBlank,
  isNotNull,
} from '../../../../shared/util/helper';
import { ReplaceValueList, ReplaceValueMap } from '../../model';
import { ReplaceValueMapService } from '../../service/replace-value-map.service';

@Component({
  selector: 'app-replace-value-map',

  imports: [
    MatTableModule,
    TranslatePipe,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    ScrollTopComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }],
  templateUrl: './replace-value-map.component.html',
})
export class ReplaceValueMapComponent {
  searchName = '';
  displayedColumns = ['match', 'replaceValue', 'other'];
  readonly dataSource = new MatTableDataSource<ReplaceValueList>([]);

  private readonly replaceValueMapService = inject(ReplaceValueMapService);
  private readonly selectTableService = inject(SelectTableService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly messageBoxService = inject(MessageBoxService);
  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });
  }

  swap() {
    this.dataSource.data = this.dataSource.data.map(row => ({
      ...row,
      match: row.replaceValue,
      replaceValue: row.match,
    }));
  }

  add() {
    this.dataSource.data = [
      ...this.dataSource.data,
      { match: '', replaceValue: '' },
    ];
  }

  search() {
    if (isBlank(this.searchName)) {
      this.snackbarService.isBlankMessage('replaceValueMap.searchName');
      return;
    }

    this.replaceValueMapService.getByName(this.searchName).subscribe(res => {
      if (res) {
        this.dataSource.data = Object.entries(res.map).map(x => ({
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
          this.dataSource.data = Object.entries(res.map).map(x => ({
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
        this.dataSource.data = Object.entries(data).map(x => ({
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
    this.dataSource.data = this.dataSource.data.filter(row => row !== element);
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
