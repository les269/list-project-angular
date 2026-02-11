import {
  Component,
  EventEmitter,
  input,
  Input,
  OnInit,
  output,
  Output,
} from '@angular/core';

import { ShareTagValue, ThemeTag } from '../../models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-item-tag-buttons',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './item-tag-buttons.component.html',
  styleUrl: './item-tag-buttons.component.scss',
})
export class ItemTagButtonsComponent {
  value = input.required<string>();
  themeTagList = input.required<ThemeTag[]>();
  data = input.required<any>();
  shareTagNameMap = input.required<{ [key in string]: string }>();
  shareTagValueMap = input.required<{ [key in string]: string[] }>();
  tagValueUpdate = output<ShareTagValue>();

  showTagCheck(shareTagId: string): boolean {
    return this.shareTagValueMap()[shareTagId]?.includes(this.value());
  }

  onSetTag(shareTagId: string) {
    this.tagValueUpdate.emit({
      value: this.value(),
      shareTagId,
    });
  }
}
