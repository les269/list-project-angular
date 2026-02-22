import { Component, computed, input, output } from '@angular/core';

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
  shareTagNameMap = input.required<Record<string, string>>();
  shareTagValueMap = input.required<Record<string, string[]>>();
  tagValueUpdate = output<ShareTagValue>();

  checkedTags = computed(() => {
    const valueMap = this.shareTagValueMap();
    const currentValue = this.value();
    return new Set(
      Object.keys(valueMap).filter(id => valueMap[id]?.includes(currentValue))
    );
  });

  onSetTag(shareTagId: string) {
    this.tagValueUpdate.emit({
      value: this.value(),
      shareTagId,
    });
  }
}
