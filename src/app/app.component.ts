import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component';
import { SidenavComponent } from './core/layout/sidenav/sidenav.component';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectLayoutByKey } from './shared/state/layout.selectors';
import { changeSidenav } from './shared/state/layout.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidenavComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  title = 'list-project-angular';
  openSidenav$: Observable<Readonly<boolean>>;
  @ViewChild('header', { read: ElementRef }) header!: ElementRef;
  headerHeight = 0;

  constructor(private store: Store) {
    this.openSidenav$ = this.store.pipe(selectLayoutByKey('openSidenav'));
  }

  ngAfterViewInit() {
    // 等待視圖初始化後取得 header 高度
    this.headerHeight = this.header.nativeElement.lastChild.offsetHeight;
  }

  closeSidenav() {
    this.store.dispatch(changeSidenav());
  }
}
