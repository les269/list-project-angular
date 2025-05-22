import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
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
import { filter, map, mergeMap, Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectLayoutByKey } from './shared/state/layout.selectors';
import { changeSidenav, updateTitle } from './shared/state/layout.actions';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidenavComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  openSidenav$: Observable<Readonly<boolean>>;
  private scrollY = 0;

  constructor(
    private store: Store,
    private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService
  ) {
    this.openSidenav$ = this.store.pipe(selectLayoutByKey('openSidenav'));
  }
  ngOnInit(): void {
    this.router.events
      .pipe(
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
      )
      .subscribe(title => {
        if (title) {
          title = this.translateService.instant(title);
          this.titleService.setTitle(title);
          this.store.dispatch(updateTitle({ title }));
        }
      });
    this.openSidenav$.subscribe(open => {
      if (open) {
        this.scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.classList.add('lock-scrollbar');
        document.body.style.top = `-${this.scrollY}px`;
      } else {
        document.body.style.overflow = '';
        document.body.classList.remove('lock-scrollbar');
        document.body.style.top = '';
        window.scrollBy({ top: this.scrollY, behavior: 'instant' });
      }
    });
  }

  closeSidenav() {
    this.store.dispatch(changeSidenav());
  }
}
