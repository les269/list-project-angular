import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { changeSidenav } from '../../../shared/state/layout.actions';
import { selectLayoutTitle } from '../../../shared/state/layout.selectors';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.component.html',
  styleUrls: ['header.component.scss'],
  imports: [MatIconModule, MatButtonModule],
  standalone: true,
})
export class HeaderComponent {
  store = inject(Store);
  title = toSignal(this.store.pipe(selectLayoutTitle()), {
    initialValue: '',
  });
  openMenu() {
    this.store.dispatch(changeSidenav());
  }
}
