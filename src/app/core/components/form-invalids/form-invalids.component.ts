import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { hasFieldError } from '../../../shared/util/signal-form';
import { FormInvalid } from '../../model/form-invalids.model';

@Component({
  selector: 'app-form-invalids',
  imports: [MatIconModule],
  templateUrl: './form-invalids.component.html',
})
export class FormInvalidsComponent {
  readonly hasError = hasFieldError;
  readonly control = input.required<() => FieldState<any>>();
  readonly formAlerts = input.required<FormInvalid[]>();
}
