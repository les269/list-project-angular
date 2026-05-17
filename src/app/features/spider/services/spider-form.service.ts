import { computed, inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  ValuePipeline,
  ValuePipelineType,
  InsertConfig,
  DeleteConfig,
  MoveCharConfig,
  ChineseConvertType,
  ConvertToCaseType,
  PositionType,
  ExtractionRule,
  ExtractionStepCondition,
  TimeFormatOption,
  Timezones,
  ChineseConvert,
  ZhConverterUtilType,
  CalculateConfig,
} from '../model';
import { ChipsMapValue, ControlsOf } from '../../../core/model';
import dayjs from 'dayjs';

@Injectable({ providedIn: 'root' })
export class SpiderFormService {
  readonly fb = inject(FormBuilder);
  readonly eValuePipelineType = ValuePipelineType;
  readonly eConvertToCaseType = ConvertToCaseType;
  readonly eChineseConvertType = ChineseConvertType;
  readonly ePositionType = PositionType;

  readonly currentTimezones = computed(() => {
    // 取得偏移分鐘數，例如台北是 480
    const offsetMinutes = dayjs().utcOffset();
    const hours = offsetMinutes / 60;

    const prefix = hours >= 0 ? 'P' : 'M';
    // 格式化數字，確保是兩位數 (如 08, 05)
    const absHours = Math.abs(hours).toString().padStart(2, '0');

    const key = `GMT_${prefix}${absHours}` as keyof typeof Timezones;

    // 回傳對應的 Enum 值，如果找不到則預設 GMT_P00
    return Timezones[key] ?? Timezones.GMT_P00;
  });

  readonly createExtractionRule = (data?: Partial<ExtractionRule>) => {
    return this.fb.nonNullable.group({
      seq: [data?.seq ?? 0],
      key: [data?.key ?? ''],
      selector: [data?.selector ?? ''],
      jsonPath: [data?.jsonPath ?? ''],
      pipelines: this.fb.nonNullable.array<
        FormGroup<ControlsOf<ValuePipeline>>
      >(
        (data?.pipelines ?? []).map(pipeline =>
          this.createPipelineGroup(pipeline)
        )
      ),
      conditionValue: this.fb.nonNullable.group({
        conditionType: [
          data?.conditionValue?.conditionType ?? ExtractionStepCondition.ALWAYS,
        ],
        key: [data?.conditionValue?.key ?? ''],
        value: [data?.conditionValue?.value ?? ''],
        ignoreCase: [data?.conditionValue?.ignoreCase ?? false],
      }),
    }) as FormGroup<ControlsOf<ExtractionRule>>;
  };

  createPipelineGroup(
    data?: Partial<ValuePipeline>
  ): FormGroup<ControlsOf<ValuePipeline>> {
    return this.fb.nonNullable.group({
      seq: [data?.seq ?? 0],
      type: [data?.type ?? ValuePipelineType.FIXED_VALUE],
      enabled: [data?.enabled ?? true],
      fixedValue: [data?.fixedValue ?? ''],
      fixedJsonValue: [data?.fixedJsonValue ?? ''],
      currentDataKey: [data?.currentDataKey ?? ''],
      attributeName: [data?.attributeName ?? ''],
      pattern: [data?.pattern ?? ''],
      replacement: [data?.replacement ?? ''],
      separator: [data?.separator ?? ''],
      joinSeparator: [data?.joinSeparator ?? ','],
      combineToString: [data?.combineToString ?? ''],
      combineByKey: [data?.combineByKey ?? ''],
      useReplaceValueMap: [data?.useReplaceValueMap ?? ''],
      mergeMultiObjKeys: [data?.mergeMultiObjKeys ?? []],
      mergeMultiArrayKeys: [data?.mergeMultiArrayKeys ?? []],
      convertToCaseType: [data?.convertToCaseType ?? ConvertToCaseType.UPPER],
      currentTimeFormatOption: this.createTimeFormatOptionGroup(
        data?.currentTimeFormatOption
      ),
      timeFormat: this.createTimeFormatOptionGroup(data?.timeFormat),
      chineseConvert: this.createChineseConvertGroup(data?.chineseConvert),
      insertConfig: this.createInsertConfigGroup(data?.insertConfig),
      deleteConfig: this.createDeleteConfigGroup(data?.deleteConfig),
      deletePaths: [data?.deletePaths ?? []],
      moveCharConfig: this.createMoveCharConfigGroup(data?.moveCharConfig),
      calculateConfig: this.createCalculateConfigGroup(data?.calculateConfig),
    }) as FormGroup<ControlsOf<ValuePipeline>>;
  }

  createInsertConfigGroup(data?: Partial<InsertConfig>) {
    return this.fb.nonNullable.group({
      position: [data?.position ?? PositionType.START],
      text: [data?.text ?? ''],
      index: [data?.index ?? 1],
    }) as FormGroup<ControlsOf<InsertConfig>>;
  }

  createDeleteConfigGroup(data?: Partial<DeleteConfig>) {
    return this.fb.nonNullable.group({
      position: [data?.position ?? PositionType.START],
      length: [data?.length ?? 1],
      index: [data?.index ?? 1],
    }) as FormGroup<ControlsOf<DeleteConfig>>;
  }

  createMoveCharConfigGroup(data?: Partial<MoveCharConfig>) {
    return this.fb.nonNullable.group({
      fromIndex: [data?.fromIndex ?? 1],
      toIndex: [data?.toIndex ?? 1],
    }) as FormGroup<ControlsOf<MoveCharConfig>>;
  }

  createTimeFormatOptionGroup(data?: Partial<TimeFormatOption>) {
    return this.fb.nonNullable.group({
      format: [data?.format ?? 'YYYY-MM-dd HH:mm:ss'],
      timezones: [data?.timezones ?? this.currentTimezones()],
      skipTimezoneConversion: [data?.skipTimezoneConversion ?? false],
      formatParsed: [data?.formatParsed ?? 'YYYY-MM-dd HH:mm:ss'],
    }) as FormGroup<ControlsOf<TimeFormatOption>>;
  }

  createChineseConvertGroup(data?: Partial<ChineseConvert>) {
    return this.fb.nonNullable.group({
      chineseConvertType: [
        data?.chineseConvertType ??
          ChineseConvertType.SIMPLIFIED_TO_TRADITIONAL,
      ],
      zhConverterUtilType: [
        data?.zhConverterUtilType ?? ZhConverterUtilType.ZH_CONVERTER_UTIL,
      ],
    }) as FormGroup<ControlsOf<ChineseConvert>>;
  }
  createCalculateConfigGroup(data?: Partial<CalculateConfig>) {
    return this.fb.nonNullable.group({
      variablePaths: [data?.variablePaths ?? ([] as ChipsMapValue[])],
      expression: [data?.expression ?? ''],
      defaultValue: [data?.defaultValue ?? ''],
    }) as FormGroup<ControlsOf<CalculateConfig>>;
  }
}
