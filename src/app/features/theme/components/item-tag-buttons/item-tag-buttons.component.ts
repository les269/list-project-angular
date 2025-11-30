import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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
  @Input({ required: true }) value: string = '';
  @Input({ required: true }) themeTagList!: ThemeTag[];
  @Input({ required: true }) data!: any;
  @Input({ required: true }) shareTagNameMap!: { [key in string]: string };
  @Input({ required: true }) shareTagValueMap!: { [key in string]: string[] };
  @Output() tagValueUpdate = new EventEmitter<ShareTagValue>();

  showTagCheck(shareTagId: string): boolean {
    return this.shareTagValueMap[shareTagId].includes(this.value);
  }

  onSetTag(shareTagId: string) {
    this.tagValueUpdate.emit({
      value: this.value,
      shareTagId,
    });
  }
}
