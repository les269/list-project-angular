import { computed, Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { ChipsMapValue } from '../../../core/model';
import {
  CalculateConfig,
  ChineseConvert,
  ChineseConvertType,
  ConvertToCaseType,
  DeleteConfig,
  InsertConfig,
  MoveCharConfig,
  PositionType,
  TimeFormatOption,
  Timezones,
  ValuePipeline,
  ValuePipelineType,
  ZhConverterUtilType,
} from '../model';

@Injectable({ providedIn: 'root' })
export class ValuePipelineFormService {
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

  createValuePipeline(data?: Partial<ValuePipeline>) {
    return {
      seq: data?.seq ?? 0,
      type: data?.type ?? ValuePipelineType.FIXED_VALUE,
      enabled: data?.enabled ?? true,
      fixedValue: data?.fixedValue ?? '',
      fixedJsonValue: data?.fixedJsonValue ?? '',
      currentDataKey: data?.currentDataKey ?? '',
      attributeName: data?.attributeName ?? '',
      pattern: data?.pattern ?? '',
      replacement: data?.replacement ?? '',
      separator: data?.separator ?? '',
      joinSeparator: data?.joinSeparator ?? ',',
      combineToString: data?.combineToString ?? '',
      combineByKey: data?.combineByKey ?? '',
      mergeMultiObjKeys: data?.mergeMultiObjKeys ?? [],
      mergeMultiArrayKeys: data?.mergeMultiArrayKeys ?? [],
      convertToCaseType: data?.convertToCaseType ?? ConvertToCaseType.UPPER,
      currentTimeFormatOption: this.createTimeFormatOption(
        data?.currentTimeFormatOption
      ),
      timeFormat: this.createTimeFormatOption(data?.timeFormat),
      chineseConvert: this.createChineseConvert(data?.chineseConvert),
      insertConfig: this.createInsertConfig(data?.insertConfig),
      deleteConfig: this.createDeleteConfig(data?.deleteConfig),
      deletePaths: data?.deletePaths ?? [],
      moveCharConfig: this.createMoveCharConfig(data?.moveCharConfig),
      calculateConfig: this.createCalculateConfig(data?.calculateConfig),
      fetchCookieName: data?.fetchCookieName ?? '',
      fetchHeaderName: data?.fetchHeaderName ?? '',
      fetchCurrentDataKey: data?.fetchCurrentDataKey ?? '',
    };
  }

  createInsertConfig(data?: Partial<InsertConfig>) {
    return {
      position: data?.position ?? PositionType.START,
      text: data?.text ?? '',
      index: data?.index ?? 1,
    };
  }

  createDeleteConfig(data?: Partial<DeleteConfig>) {
    return {
      position: data?.position ?? PositionType.START,
      length: data?.length ?? 1,
      index: data?.index ?? 1,
    };
  }

  createMoveCharConfig(data?: Partial<MoveCharConfig>) {
    return {
      fromIndex: data?.fromIndex ?? 1,
      toIndex: data?.toIndex ?? 1,
    };
  }

  createTimeFormatOption(data?: Partial<TimeFormatOption>) {
    return {
      format: data?.format ?? 'YYYY-MM-dd HH:mm:ss',
      timezones: data?.timezones ?? this.currentTimezones(),
      skipTimezoneConversion: data?.skipTimezoneConversion ?? false,
      formatParsed: data?.formatParsed ?? 'YYYY-MM-dd HH:mm:ss',
    };
  }

  createChineseConvert(data?: Partial<ChineseConvert>) {
    return {
      chineseConvertType:
        data?.chineseConvertType ??
        ChineseConvertType.SIMPLIFIED_TO_TRADITIONAL,
      zhConverterUtilType:
        data?.zhConverterUtilType ?? ZhConverterUtilType.ZH_CONVERTER_UTIL,
    };
  }
  createCalculateConfig(data?: Partial<CalculateConfig>) {
    return {
      variablePaths: data?.variablePaths ?? ([] as ChipsMapValue[]),
      expression: data?.expression ?? '',
      defaultValue: data?.defaultValue ?? '',
    };
  }
}
