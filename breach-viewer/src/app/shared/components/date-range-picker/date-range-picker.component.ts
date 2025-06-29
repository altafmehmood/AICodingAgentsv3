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