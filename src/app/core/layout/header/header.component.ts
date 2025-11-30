import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { changeSidenav } from '../../../shared/state/layout.actions';
import { Observable } from 'rxjs';
import { selectLayoutByKey } from '../../../shared/state/layout.selectors';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.component.html',
  styleUrls: ['header.component.scss'],
  imports: [
    RouterLinkActive,
    RouterLink,
    AsyncPipe,
    MatIconModule,
    MatButtonModule
],
  standalone: true,
})
export class HeaderComponent {
  title$: Observable<Readonly<string>>;
  constructor(private store: Store) {
    this.title$ = this.store.pipe(selectLayoutByKey('title'));
  }

  openMenu() {
    this.store.dispatch(changeSidenav());
  }
}
