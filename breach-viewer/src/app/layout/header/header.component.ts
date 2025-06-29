import { Component, Output, EventEmitter } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <span class="app-title">
        <mat-icon class="app-icon">security</mat-icon>
        Breach Viewer
      </span>
      <span class="spacer"></span>
      <button mat-raised-button color="accent" (click)="onExportPdf()">
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
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .app-title {
      display: flex;
      align-items: center;
      font-size: 1.25rem;
      font-weight: 500;
    }
    
    .app-icon {
      margin-right: 0.5rem;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class HeaderComponent {
  @Output() exportPdf = new EventEmitter<void>();

  onExportPdf(): void {
    this.exportPdf.emit();
  }
}