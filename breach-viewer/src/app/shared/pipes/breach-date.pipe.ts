import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'breachDate',
  standalone: true
})
export class BreachDatePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}