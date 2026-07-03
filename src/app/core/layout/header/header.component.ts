import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LayoutStore } from '../../stores/layout.store';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.component.html',
  styleUrls: ['header.component.scss'],
  imports: [MatIconModule, MatButtonModule],
})
export class HeaderComponent {
  store = inject(LayoutStore);
}
