import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormInvalid } from '../../model/form-invalids.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-form-invalids',
  imports: [MatIconModule],
  templateUrl: './form-invalids.component.html',
})
export class FormInvalidsComponent {
  readonly control = input.required<AbstractControl>();
  readonly formAlerts = input.required<FormInvalid[]>();
}
