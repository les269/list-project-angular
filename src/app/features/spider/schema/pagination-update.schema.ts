import {
  applyWhen,
  min,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  LastUpdateMode,
  SpiderPaginationConfig,
  UpdateIntervalMode,
} from '../model';

// 更新控制會引用起始參數，因此 schema 同時接收這兩個區塊。
export const paginationUpdateSchema = schema<
  Pick<SpiderPaginationConfig, 'paramSettings' | 'updateControl'>
>(config => {
  const control = config.updateControl;
  required(control.lastUpdateParamKey, {
    when: ({ valueOf }) =>
      valueOf(control.lastUpdateMode) === LastUpdateMode.USE_PARAM,
  });
  required(control.updateIntervalParamKey, {
    when: ({ valueOf }) =>
      valueOf(control.updateIntervalMode) === UpdateIntervalMode.USE_PARAM,
  });
  applyWhen(
    control,
    ({ value }) => value().updateIntervalMode === UpdateIntervalMode.FIXED,
    p => min(p.updateInterval, 1)
  );
  validate(control.lastUpdateParamKey, ({ value, valueOf }) => {
    if (valueOf(control.lastUpdateMode) !== LastUpdateMode.USE_PARAM)
      return undefined;
    return valueOf(config.paramSettings).some(p => p.paramKey === value())
      ? undefined
      : {
          kind: 'param',
          message: 'spiderPagination.validation.missingParam',
        };
  });
  validate(control.updateIntervalParamKey, ({ value, valueOf }) => {
    if (valueOf(control.updateIntervalMode) !== UpdateIntervalMode.USE_PARAM)
      return undefined;
    return valueOf(config.paramSettings).some(p => p.paramKey === value())
      ? undefined
      : {
          kind: 'param',
          message: 'spiderPagination.validation.missingParam',
        };
  });
  validate(control.lastUpdateDate, ({ value, valueOf }) => {
    if (valueOf(control.lastUpdateMode) !== LastUpdateMode.FIXED)
      return undefined;
    return Number.isFinite(new Date(value()).getTime())
      ? undefined
      : { kind: 'date', message: 'spiderPagination.validation.invalidDate' };
  });
});
