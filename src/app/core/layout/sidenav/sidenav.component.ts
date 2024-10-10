import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectLayoutByKey } from '../../../shared/state/layout.selectors';
import { changeSidenav } from '../../../shared/state/layout.actions';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {
  openSidenav$: Observable<Readonly<boolean>>;
  myRoutes: any = [
    {
      path: '',
      title: 'home',
    },
  ];

  constructor(private store: Store) {
    this.openSidenav$ = this.store.pipe(selectLayoutByKey('openSidenav'));
  }
  ngOnInit() {}

  close() {
    this.store.dispatch(changeSidenav());
  }
}
