import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeTag, ThemeTagValue } from '../../models';
import { MatIconModule } from '@angular/material/icon';
export interface ThemeTagUpdate {
  value: string;
  tag: string;
}

@Component({
  selector: 'app-item-tag-buttons',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './item-tag-buttons.component.html',
  styleUrl: './item-tag-buttons.component.scss',
})
export class ItemTagButtonsComponent {
  @Input({ required: true }) value: string = '';
  @Input({ required: true }) themeTagList!: ThemeTag[];
  @Input({ required: true }) data!: any;
  @Input({ required: true }) themeTagValueList!: ThemeTagValue[];
  @Output() tagValueUpdate = new EventEmitter<ThemeTagUpdate>();

  showTag(tag: string): boolean {
    return this.themeTagValueList
      .filter(x => x.valueList.includes(this.value))
      .map(x => x.tag)
      .includes(tag);
  }

  onSetTag(tag: string) {
    this.tagValueUpdate.emit({
      value: this.value,
      tag: tag,
    });
  }
}
