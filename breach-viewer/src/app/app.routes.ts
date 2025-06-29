import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/breaches', pathMatch: 'full' },
  { 
    path: 'breaches', 
    loadChildren: () => import('./features/breach-management/breach-management.module')
      .then(m => m.BreachManagementModule)
  },
  { path: '**', redirectTo: '/breaches' }
];
