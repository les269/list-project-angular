import { FormInvalidsComponent } from '../../../../core/components/form-invalids/form-invalids.component';
import { SignalFieldType } from '../../../../core/model/signal-field.model';
import { Component, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import { toKeyValueArray } from '../../../../shared/util/helper';
import { ParamSetting, ParamType, TimeUnit, EndTimeType } from '../../model';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { toSignalFieldOptions } from '../../../../shared/util/signal-field';

@Component({
  selector: 'app-pagination-params',
  imports: [
    TranslateModule,
    GenericTableComponent,
    SignalFieldComponent,
    FormInvalidsComponent,
  ],
  templateUrl: './pagination-params.component.html',
})
export class PaginationParamsComponent {
  readonly fieldType = SignalFieldType;
  readonly fields = input.required<FieldTree<ParamSetting[]>>();
  readonly paramType = ParamType;
  readonly endTimeType = EndTimeType;
  readonly timeOptions = toSignalFieldOptions(
    TimeUnit,
    'spiderPagination.timeUnits'
  );
  readonly endOptions = toSignalFieldOptions(
    EndTimeType,
    'spiderPagination.endTimeTypes'
  );
  readonly paramDisplayedColumns = ['paramKey', 'type'];
  readonly paramColumns: GenericTableColumn[] = [
    {
      key: 'paramKey',
      label: 'spiderPagination.paramKey',
      columnType: GenericColumnType.input,
    },
    {
      key: 'type',
      label: 'spiderPagination.paramType',
      columnType: GenericColumnType.select,
      data: toKeyValueArray(ParamType),
      dataValue: 'value',
      dataLabel: item => `spiderPagination.paramTypes.${item.value}`,
    },
  ];
  readonly createParam = (value?: Partial<ParamSetting> & { seq?: number }) => {
    return {
      seq: value?.seq ?? 0,
      paramKey: '',
      type: ParamType.STATIC_LIST,
      staticList: [] as string[],
      startNumStr: '',
      endNumStr: '',
      numStep: 1,
      padZeros: false,
      timeFormat: 'yyyy-MM-dd',
      timeInterval: 1,
      timeIntervalUnit: TimeUnit.YEAR,
      ...value,
      startTime:
        value?.startTime === undefined ? new Date() : new Date(value.startTime),
      endTimeConfig: {
        endTimeType: EndTimeType.CURRENT_DATE,
        timeFormat: 'yyyy-MM-dd',
        offsetInterval: 0,
        offsetUnit: TimeUnit.DAY,
        ...value?.endTimeConfig,
        endTime:
          value?.endTimeConfig?.endTime === undefined
            ? new Date()
            : new Date(value.endTimeConfig.endTime),
      },
    };
  };
}
