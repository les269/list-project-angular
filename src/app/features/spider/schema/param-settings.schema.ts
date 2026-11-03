import {
  applyEach,
  applyWhen,
  min,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { EndTimeType, ParamSetting, ParamType } from '../model';

export const paramSettingsSchema = schema<ParamSetting[]>(params => {
  applyEach(params, p => {
    required(p.paramKey);
    applyWhen(
      p,
      ({ value }) => value().type === ParamType.STATIC_LIST,
      p => {
        validate(p.staticList, ({ value }) =>
          value().length && value().every(v => v.trim())
            ? undefined
            : {
                kind: 'required',
                message: 'spiderPagination.validation.staticListRequired',
              }
        );
      }
    );
    applyWhen(
      p,
      ({ value }) => value().type === ParamType.NUMBER_RANGE,
      p => {
        required(p.startNumStr);
        required(p.endNumStr);
        min(p.numStep, 1);
        validate(p.endNumStr, ({ valueOf }) => {
          const v = valueOf(p);
          return /^-?\d+$/.test(v.startNumStr) &&
            /^-?\d+$/.test(v.endNumStr) &&
            BigInt(v.startNumStr) <= BigInt(v.endNumStr) &&
            Number.isInteger(v.numStep)
            ? undefined
            : {
                kind: 'range',
                message: 'spiderPagination.validation.numberRange',
              };
        });
      }
    );
    applyWhen(
      p,
      ({ value }) => value().type === ParamType.TIME_RANGE,
      p => {
        validate(p.startTime, ({ value }) =>
          Number.isFinite(value().getTime())
            ? undefined
            : {
                kind: 'date',
                message: 'spiderPagination.validation.invalidDate',
              }
        );
        required(p.timeFormat);
        min(p.timeInterval, 1);
        applyWhen(
          p.endTimeConfig,
          ({ value }) => value().endTimeType === EndTimeType.FIXED,
          end => {
            validate(end.endTime, ({ value }) =>
              Number.isFinite(value().getTime())
                ? undefined
                : {
                    kind: 'date',
                    message: 'spiderPagination.validation.invalidDate',
                  }
            );
          }
        );
      }
    );
  });
  validate(params, ({ value }) => {
    const keys = value().map(p => p.paramKey.trim());
    return new Set(keys).size === keys.length
      ? undefined
      : {
          kind: 'duplicate',
          message: 'spiderPagination.validation.duplicateParam',
        };
  });
});
