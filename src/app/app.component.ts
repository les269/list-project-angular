import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component';
import { SidenavComponent } from './core/layout/sidenav/sidenav.component';
import { CommonModule } from '@angular/common';
import { filter, map, mergeMap } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectLayoutOpen } from './shared/state/layout.selectors';
import { changeSidenav, updateTitle } from './shared/state/layout.actions';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, SidenavComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  store = inject(Store);
  titleService = inject(Title);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  translateService = inject(TranslateService);

  // Signals for state management
  readonly openSidenav = toSignal(this.store.pipe(selectLayoutOpen()), {
    initialValue: false,
  });

  private scrollY = 0;
  readonly isFirefox = signal(navigator.userAgent.includes('Firefox'));

  readonly lockScrollbar = computed(() =>
    this.isFirefox() ? 'lock-scrollbar-firefox' : 'lock-scrollbar'
  );

  readonly title = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      mergeMap(route => route.data),
      map(data => data['title'])
    ),
    { initialValue: undefined as string | undefined }
  );

  constructor() {
    // Effect: Handle sidenav scroll lock
    effect(() => {
      const open = this.openSidenav();
      const lockScrollbar = this.lockScrollbar();
      const isFirefox = this.isFirefox();

      if (open) {
        this.scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.classList.add(lockScrollbar);
        if (!isFirefox) {
          document.body.style.top = `-${this.scrollY}px`;
        }
      } else {
        document.body.style.overflow = '';
        document.body.classList.remove(lockScrollbar);
        if (!isFirefox) {
          document.body.style.top = '';
          window.scrollBy({ top: this.scrollY, behavior: 'instant' });
        }
      }
    });

    // Effect: Handle page title updates
    effect(() => {
      const title = this.title();
      if (title) {
        const translatedTitle = this.translateService.instant(title);
        this.titleService.setTitle(translatedTitle);
        this.store.dispatch(updateTitle({ title: translatedTitle }));
      }
    });
  }

  closeSidenav() {
    this.store.dispatch(changeSidenav());
  }
}
