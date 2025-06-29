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
      margin-bottom: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .date-range-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .button-group {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .button-group button[mat-raised-button] {
      background: #0f172a;
      color: white;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .button-group button[mat-raised-button]:hover {
      background: #1e293b;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
    }
    
    .button-group button[mat-button] {
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    
    .button-group button[mat-button]:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
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