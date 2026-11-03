import { inject, Injectable } from '@angular/core';
import { ExtractionRule, ExtractionStepCondition } from '../model';
import { ValuePipelineFormService } from './value-pipeline-form.service';

@Injectable({ providedIn: 'root' })
export class ExtractionRuleFormService {
  private readonly pipelines = inject(ValuePipelineFormService);

  createRule(data?: Partial<ExtractionRule>) {
    return {
      seq: data?.seq ?? 0,
      key: data?.key ?? '',
      selector: data?.selector ?? '',
      jsonPath: data?.jsonPath ?? '',
      pipelines: (data?.pipelines ?? []).map(p =>
        this.pipelines.createValuePipeline(p)
      ),
      conditionValue: {
        conditionType:
          data?.conditionValue?.conditionType ?? ExtractionStepCondition.ALWAYS,
        key: data?.conditionValue?.key ?? '',
        value: data?.conditionValue?.value ?? '',
        ignoreCase: data?.conditionValue?.ignoreCase ?? false,
      },
    };
  }
}
