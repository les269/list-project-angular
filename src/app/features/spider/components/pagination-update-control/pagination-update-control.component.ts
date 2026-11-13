import { SignalFieldType } from '../../../../core/model/signal-field.model';
import { Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import {
  UpdateControl,
  ParamSetting,
  LastUpdateMode,
  UpdateIntervalMode,
  TimeUnit,
} from '../../model';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { toSignalFieldOptions } from '../../../../shared/util/signal-field';

@Component({
  selector: 'app-pagination-update-control',
  imports: [TranslatePipe, SignalFieldComponent],
  templateUrl: './pagination-update-control.component.html',
})
export class PaginationUpdateControlComponent {
  readonly fieldType = SignalFieldType;
  readonly fields = input.required<FieldTree<UpdateControl>>();
  readonly params = input.required<FieldTree<ParamSetting[]>>();
  readonly lastMode = LastUpdateMode;
  readonly intervalMode = UpdateIntervalMode;
  readonly lastOptions = toSignalFieldOptions(
    LastUpdateMode,
    'spiderPagination.lastUpdateModes'
  );
  readonly intervalOptions = toSignalFieldOptions(
    UpdateIntervalMode,
    'spiderPagination.updateIntervalModes'
  );
  readonly timeOptions = toSignalFieldOptions(
    TimeUnit,
    'spiderPagination.timeUnits'
  );
  readonly paramOptions = computed(() =>
    this.params()()
      .value()
      .map(p => ({ value: p.paramKey, label: p.paramKey }))
  );
}
