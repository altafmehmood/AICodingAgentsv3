import { Component, Output, EventEmitter } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="header-toolbar">
      <span class="app-title">
        <mat-icon class="app-icon">security</mat-icon>
        BreachViewer
      </span>
      <span class="spacer"></span>
      <button mat-raised-button class="export-button" (click)="onExportPdf()">
        <mat-icon>picture_as_pdf</mat-icon>
        Export PDF
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: white;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-bottom: 1px solid #e2e8f0;
    }
    
    .app-title {
      display: flex;
      align-items: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.025em;
    }
    
    .app-icon {
      margin-right: 0.75rem;
      color: #0f172a;
      font-size: 1.75rem;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .export-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #0f172a;
      color: white;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .export-button:hover {
      background: #1e293b;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
    }
  `]
})
export class HeaderComponent {
  @Output() exportPdf = new EventEmitter<void>();

  onExportPdf(): void {
    this.exportPdf.emit();
  }
}