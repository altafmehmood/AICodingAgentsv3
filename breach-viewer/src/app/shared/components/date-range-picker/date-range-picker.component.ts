import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { DateRangeParams } from '../../../core/models';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatNativeDateModule,
    MatCardModule
  ],
  template: `
    <mat-card class="filter-card">
      <mat-card-header>
        <mat-card-title>Filter Breaches</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="dateRangeForm" class="date-range-form">
          <mat-form-field appearance="outline">
            <mat-label>From Date</mat-label>
            <input matInput [matDatepicker]="fromPicker" formControlName="from">
            <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>To Date</mat-label>
            <input matInput [matDatepicker]="toPicker" formControlName="to">
            <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </mat-form-field>

          <div class="button-group">
            <button mat-raised-button color="primary" type="button" (click)="applyFilter()">
              Apply Filter
            </button>
            <button mat-button type="button" (click)="clearFilter()">
              Clear
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .filter-card {
      margin-bottom: 2rem;
      background: #ffffff;
      border-radius: 2px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
      border: 1px solid #f0f0f0;
    }
    
    .filter-card mat-card-title {
      font-size: 1.25rem;
      font-weight: 500;
      font-family: 'Playfair Display', serif;
      color: #2c2c2c;
      margin-bottom: 0.5rem;
    }
    
    .date-range-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .button-group {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    
    .button-group button[mat-raised-button] {
      background: #184B29;
      color: white;
      border-radius: 2px;
      font-weight: 500;
      transition: all 0.2s ease;
      padding: 12px 24px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      letter-spacing: 0.02em;
    }
    
    .button-group button[mat-raised-button]:hover {
      background: #0f3319;
      box-shadow: 0 2px 4px rgba(24, 75, 41, 0.2);
    }
    
    .button-group button[mat-button] {
      color: #666666;
      border: 1px solid #e0e0e0;
      border-radius: 2px;
      transition: all 0.2s ease;
      background: #ffffff;
      padding: 12px 24px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      letter-spacing: 0.02em;
    }
    
    .button-group button[mat-button]:hover {
      background: #fafafa;
      border-color: #184B29;
      color: #184B29;
    }
    
    @media (min-width: 768px) {
      .date-range-form {
        flex-direction: row;
        align-items: flex-start;
      }
      
      .button-group {
        margin-top: 0;
        align-items: flex-end;
      }
    }
    
    mat-form-field {
      border-radius: 12px;
    }
    
    mat-form-field .mat-mdc-form-field-subscript-wrapper {
      margin-top: 0.5rem;
    }
  `]
})
export class DateRangePickerComponent {
  @Output() filterChange = new EventEmitter<DateRangeParams>();

  dateRangeForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null)
  });

  applyFilter(): void {
    const fromDate = this.dateRangeForm.value.from;
    const toDate = this.dateRangeForm.value.to;
    
    const params: DateRangeParams = {
      from: fromDate ? fromDate.toISOString().split('T')[0] : undefined,
      to: toDate ? toDate.toISOString().split('T')[0] : undefined
    };
    
    this.filterChange.emit(params);
  }

  clearFilter(): void {
    this.dateRangeForm.reset();
    this.filterChange.emit({});
  }
}