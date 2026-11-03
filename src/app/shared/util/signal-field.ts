import { SignalFieldOption } from '../../core/model/signal-field.model';

/** 將字串 enum 轉為帶有翻譯 key 的欄位選項。 */
export function toSignalFieldOptions(
  values: Record<string, string>,
  prefix: string
): SignalFieldOption[] {
  return Object.values(values).map(value => ({
    value,
    label: `${prefix}.${value}`,
  }));
}
