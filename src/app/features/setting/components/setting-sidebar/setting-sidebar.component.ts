import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  IsActiveMatchOptions,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

@Component({
  selector: 'app-setting-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './setting-sidebar.component.html',
  styleUrls: ['./setting-sidebar.component.scss'],
})
export class SettingSidebarComponent {
  readonly routes = [
    {
      link: '/setting',
      text: 'title.database',
    },
    {
      link: '/setting/disk',
      text: 'title.disk',
    },
  ];
  readonly matchOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
}
