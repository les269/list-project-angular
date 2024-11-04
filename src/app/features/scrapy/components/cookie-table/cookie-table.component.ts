import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Cookie, ScrapyData } from '../../model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-cookie-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './cookie-table.component.html',
  styleUrl: './cookie-table.component.scss',
})
export class CookieTableComponent {
  displayedColumns = ['name', 'value', 'other'];
  @Input({ required: true }) cookieList!: Cookie[];
  @Output() cookieListChange = new EventEmitter<Cookie[]>();

  //新增cookie資料
  onAddCookie() {
    this.cookieList = [...this.cookieList, { name: '', value: '' }];
    this.cookieListChange.emit(this.cookieList);
  }
  //刪除cookie資料
  onDeleteCookie(i: number) {
    this.cookieList.splice(i, 1);
    this.cookieList = [...this.cookieList];
    this.cookieListChange.emit(this.cookieList);
  }
}
