import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatCardModule],
  template: `
    <mat-card class="error-card">
      <mat-card-content>
        <div class="error-content">
          <mat-icon class="error-icon">error</mat-icon>
          <h3>Something went wrong</h3>
          <p>{{ message }}</p>
          <button mat-raised-button color="primary" (click)="onRetry()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .error-card {
      margin: 1rem;
    }
    
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 2rem;
    }
    
    .error-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #f44336;
      margin-bottom: 1rem;
    }
    
    h3 {
      margin: 0 0 1rem 0;
      color: #333;
    }
    
    p {
      margin: 0 0 2rem 0;
      color: #666;
      max-width: 400px;
    }
    
    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() message: string = 'An unexpected error occurred. Please try again.';
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}