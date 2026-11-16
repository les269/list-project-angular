import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IsActiveMatchOptions,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeHeader, ThemeHeaderType } from '../../../features/theme/models';
import { routes } from '../../../app.routes';
import { LayoutStore } from '../../stores/layout.store';

@Component({
  imports: [KeyValuePipe, RouterLink, RouterLinkActive, TranslatePipe],
  selector: 'app-sidenav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.scss'],
})
export class SidenavComponent {
  readonly router = inject(Router);
  readonly layoutStore = inject(LayoutStore);

  readonly eThemeHeaderType = ThemeHeaderType;
  readonly pageMatchOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
  readonly sectionMatchOptions: IsActiveMatchOptions = {
    ...this.pageMatchOptions,
    paths: 'subset',
  };

  readonly openSidenav = computed(() => this.layoutStore.openSidenav());
  readonly list = computed(() => this.layoutStore.visibleList());
  readonly routes = routes
    .filter(x => x.data && x.data['sidenav'])
    .map(x => ({ path: x.path, title: x.data!['title'] }));

  close() {
    if (this.openSidenav()) {
      this.layoutStore.toggleSidenav();
    }
  }

  navigateList(item: ThemeHeader) {
    return this.router
      .createUrlTree([item.type, item.name, item.version])
      .toString();
  }
}
