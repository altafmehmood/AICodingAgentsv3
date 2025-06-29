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
      border: 1px solid #fecaca;
      background: #fef2f2;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
    }
    
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 2rem;
    }
    
    .error-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #dc2626;
      margin-bottom: 1.5rem;
    }
    
    h3 {
      margin: 0 0 1rem 0;
      color: #991b1b;
      font-weight: 600;
    }
    
    p {
      margin: 0 0 2rem 0;
      color: #7f1d1d;
      max-width: 400px;
      line-height: 1.6;
    }
    
    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #dc2626;
      color: white;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    button:hover {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
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