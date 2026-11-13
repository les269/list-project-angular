import { Pipe, PipeTransform } from '@angular/core';
import { SignalFieldOption } from '../../core/model/signal-field.model';

@Pipe({
  name: 'fileSize',
})
export class FileSizePipe implements PipeTransform {
  transform(value: number): string {
    if (value === 0 || value === undefined || value === null) return '0 KB';

    const sizes = ['KB', 'MB', 'GB', 'TB'];
    let i = Math.floor(Math.log(value) / Math.log(1024));

    const fileSize = (value / Math.pow(1024, i)).toFixed(3);

    return `${fileSize} ${sizes[i - 1]}`;
  }
}

@Pipe({
  name: 'replaceValue',
})
export class ReplaceValuePipe implements PipeTransform {
  transform(value: string, obj: any): string {
    if (!value || !obj) {
      return value;
    }

    // 使用正則表達式來替換 ${key} 的字串
    return value.replace(/\$\{(.*?)\}/g, (match, key) => {
      return obj[key.trim()] || match;
    });
  }
}

@Pipe({
  name: 'enumKeys',
})
export class EnumKeysPipe implements PipeTransform {
  transform(value: object): string[] {
    return Object.keys(value);
  }
}

@Pipe({
  name: 'enumOptions',
})
export class EnumOptionsPipe implements PipeTransform {
  transform(
    values: Record<string, string>,
    prefix = '',
    uppercase = false
  ): SignalFieldOption[] {
    return Object.values(values).map(value => ({
      value,
      label: prefix
        ? `${prefix}.${value}`
        : uppercase
          ? value.toUpperCase()
          : value,
    }));
  }
}
