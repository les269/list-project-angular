import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutStore } from '../../stores/layout.store';

@Component({
  selector: 'app-layout-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrls: ['header.component.scss'],
  imports: [MatIconModule, TranslatePipe],
})
export class HeaderComponent {
  readonly store = inject(LayoutStore);
}
