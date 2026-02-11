import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-setting-link',
  imports: [RouterLink],
  templateUrl: './setting-link.component.html',
  styleUrl: './setting-link.component.scss',
})
export class SettingLinkComponent {
  text = input.required<string>();
  link = input.required<string>();
  active = input.required<boolean>();
}
