import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../features/theme/services/theme.service';
import { ThemeHeader, ThemeHeaderType } from '../../../features/theme/models';
import { routes } from '../../../app.routes';
import { LayoutStore } from '../../stores/layout.store';
import { ThemeHiddenService } from '../../../features/theme/services';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  selector: 'app-sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.scss'],
})
export class SidenavComponent {
  readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  readonly themeHiddenService = inject(ThemeHiddenService);
  readonly layoutStore = inject(LayoutStore);

  readonly eThemeHeaderType = ThemeHeaderType;
  readonly openSidenav = computed(() => this.layoutStore.openSidenav());
  readonly list = computed(() => this.layoutStore.visibleList());
  readonly routes = routes
    .filter(x => x.data && x.data['sidenav'])
    .map(x => ({ path: x.path, title: x.data!['title'] }));

  close() {
    this.layoutStore.toggleSidenav();
  }

  navigateList(item: ThemeHeader) {
    return this.router
      .createUrlTree([item.type, item.name, item.version])
      .toString();
  }
}
