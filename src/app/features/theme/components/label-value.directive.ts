import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';
import { ThemeLabel } from '../models';

interface LabelValueContext {
  label: ThemeLabel;
  index?: number;
  $implicit: any;
}
@Directive({
  selector: 'ng-template[labelValue]',
  standalone: true,
})
export class LabelValueDirective {
  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly templateRef: TemplateRef<LabelValueContext>
  ) {}
  static ngTemplateContextGuard(
    dir: LabelValueDirective,
    ctx: unknown
  ): ctx is LabelValueContext {
    return true;
  }
}
