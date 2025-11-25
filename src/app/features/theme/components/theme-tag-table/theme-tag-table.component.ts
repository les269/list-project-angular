import {
  Component,
  EventEmitter,
  Input,
  Output,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeTag } from '../../models';
import { ShareTagService } from '../../services/share-tag.service';
import { ShareTag } from '../../models';
import { isNull } from '../../../../shared/util/helper';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-theme-tag-table',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    CommonModule,
    MatListModule,
    TranslateModule,
    CdkDropList,
    CdkDrag,
    MatChipsModule,
  ],
  templateUrl: './theme-tag-table.component.html',
})
export class ThemeTagTableComponent extends GenericTableComponent<ThemeTag> {
  displayedColumns: string[] = ['seq', 'tag', 'other'];
  override item: ThemeTag = {
    seq: 0,
    shareTagId: '',
  };

  tags: ShareTag[] = [];

  constructor(
    protected override injector: Injector,
    private shareTagService: ShareTagService
  ) {
    super(injector);
    this.shareTagService.getAllTag().subscribe(tags => {
      this.tags = tags;
    });
  }

  getShareTagName(shareTagId?: string) {
    if (!shareTagId) return '';
    const found = this.tags.find(t => t.shareTagId === shareTagId);
    return found ? found.shareTagName : shareTagId;
  }

  selectShareTag(element: ThemeTag) {
    this.selectTableService
      .selectSingleShareTag(this.tags)
      .subscribe(selected => {
        if (selected) {
          // ThemeTag.tag is used to hold shareTagId
          element.shareTagId = selected.shareTagId;
        }
      });
  }
}
