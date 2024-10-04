import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectLayoutByKey } from '../../../shared/state/layout.selectors';
import { changeSidenav } from '../../../shared/state/layout.actions';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {
  openSidenav$: Observable<Readonly<boolean>>;

  constructor(private store: Store) {
    this.openSidenav$ = this.store.pipe(selectLayoutByKey('openSidenav'));
  }
  ngOnInit() {}

  close() {
    this.store.dispatch(changeSidenav());
  }
}
