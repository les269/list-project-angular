import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { ExtractionRuleMode, ValuePipelineType } from '../model';
import { ExtractionRuleFormService } from '../services/extraction-rule-form.service';
import { ValuePipelineFormService } from '../services/value-pipeline-form.service';
import { applyExtractionRulesSchema } from './extraction-rules.schema';

describe('提取模式切換', () => {
  it('保留規則與 pipeline，阻止儲存不相容步驟並在切回後恢復有效', () => {
    TestBed.runInInjectionContext(() => {
      const factory = TestBed.inject(ExtractionRuleFormService);
      const model = signal({
        mode: ExtractionRuleMode.SELECT,
        rules: [
          factory.createRule({
            key: 'url',
            selector: 'a',
            jsonPath: '$.url',
            pipelines: [
              TestBed.inject(ValuePipelineFormService).createValuePipeline({
                type: ValuePipelineType.EXTRACT_ATTR,
                attributeName: 'href',
              }),
            ],
          }),
        ],
      });
      const fields = form(model, p =>
        applyExtractionRulesSchema(p.rules, p.mode)
      );
      const original = model().rules;
      expect(fields().valid()).toBe(true);
      fields.mode().value.set(ExtractionRuleMode.JSON_PATH);
      expect(model().rules).toBe(original);
      expect(fields().invalid()).toBe(true);
      expect(fields.rules[0].pipelines[0].type().errors()[0].kind).toBe(
        'pipelineMode'
      );
      fields.mode().value.set(ExtractionRuleMode.SELECT);
      expect(model().rules).toBe(original);
      expect(fields().valid()).toBe(true);
    });
  });
});

