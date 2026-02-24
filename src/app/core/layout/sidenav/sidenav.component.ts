import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectLayoutList,
  selectLayoutOpen,
} from '../../../shared/state/layout.selectors';
import {
  changeSidenav,
  updateList,
} from '../../../shared/state/layout.actions';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../features/theme/services/theme.service';
import { ThemeHeader, ThemeHeaderType } from '../../../features/theme/models';
import { routes } from '../../../app.routes';
import { getQueryParamsByHeader } from '../../../shared/util/helper';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  selector: 'app-sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {
  router = inject(Router);
  store = inject(Store);
  themeService = inject(ThemeService);

  eThemeHeaderType = ThemeHeaderType;
  openSidenav = toSignal(this.store.pipe(selectLayoutOpen()), {
    initialValue: false,
  });
  routes = routes
    .filter(x => x.data && x.data['sidenav'])
    .map(x => ({ path: x.path, title: x.data!['title'] }));
  list = toSignal(this.store.pipe(selectLayoutList()), {
    initialValue: {
      [ThemeHeaderType.imageList]: [],
      [ThemeHeaderType.table]: [],
    },
  });
  getQueryParamsByHeader = getQueryParamsByHeader;

  ngOnInit() {
    this.themeService.updateAllTheme();
  }

  close() {
    this.store.dispatch(changeSidenav());
  }

  navigateList(item: ThemeHeader) {
    return this.router
      .createUrlTree([item.type, item.name, item.version])
      .toString();
  }
}
