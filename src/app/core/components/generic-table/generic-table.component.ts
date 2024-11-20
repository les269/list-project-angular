import {
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { isNull } from '../../../shared/util/helper';
import { SelectTableService } from '../../services/select-table.service';

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [],
  template: ``,
})
export class GenericTableComponent<T extends { seq: number }> {
  @Input({ required: true }) list!: T[];
  @Output() listChange = new EventEmitter<T[]>();
  item: T | undefined;
  dragDisabled = false;
  selectTableService: SelectTableService;

  constructor(protected injector: Injector) {
    this.selectTableService = this.injector.get(SelectTableService);
  }

  private updateSequence(list: T[]): T[] {
    return list.map((item, index) => {
      item.seq = index + 1;
      return item;
    });
  }

  onAdd() {
    if (isNull(this.list)) {
      this.list = [];
    }
    if (this.item) {
      this.list = this.updateSequence([...this.list, { ...this.item }]);
      this.listChange.emit(this.list);
    }
  }

  onDelete(index: number) {
    this.list = this.updateSequence(this.list.filter((_, i) => i !== index));
    this.listChange.emit(this.list);
  }

  drop(event: CdkDragDrop<string, string, T>) {
    const previousIndex = this.list.findIndex(
      d => d.seq === event.item.data.seq
    );

    moveItemInArray(this.list, previousIndex, event.currentIndex);
    this.list = this.updateSequence(this.list);
    this.listChange.emit(this.list);
  }
}
