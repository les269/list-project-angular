import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true,
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
  standalone: true,
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
