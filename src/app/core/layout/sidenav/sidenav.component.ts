import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectLayoutByKey } from '../../../shared/state/layout.selectors';
import {
  changeSidenav,
  updateList,
} from '../../../shared/state/layout.actions';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../features/theme/services/theme.service';
import { ThemeHeader, ThemeHeaderType } from '../../../features/theme/models';
import { routes } from '../../../app.routes';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  selector: 'app-sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {
  eThemeHeaderType = ThemeHeaderType;
  openSidenav$: Observable<Readonly<boolean>>;
  routes = routes
    .filter(x => x.data && x.data['sidenav'])
    .map(x => ({ path: x.path, title: x.data!['title'] }));
  list$: Observable<
    Readonly<{
      [key in ThemeHeaderType]: ThemeHeader[];
    }>
  >;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private store: Store
  ) {
    this.openSidenav$ = this.store.pipe(selectLayoutByKey('openSidenav'));
    this.list$ = this.store.pipe(selectLayoutByKey('list'));
  }
  ngOnInit() {
    this.themeService.getAllTheme().subscribe(res => {
      this.store.dispatch(
        updateList({
          [ThemeHeaderType.imageList]: res.filter(
            x => x.type === ThemeHeaderType.imageList
          ),
          [ThemeHeaderType.table]: res.filter(
            x => x.type === ThemeHeaderType.table
          ),
        })
      );
    });
  }

  close() {
    this.store.dispatch(changeSidenav());
  }
  navigateList(item: ThemeHeader) {
    this.router.navigate(['imageList', item.name, item.version]);
  }
}
