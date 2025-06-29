import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BreachListComponent } from './components/breach-list/breach-list.component';
import { BreachDetailComponent } from './components/breach-detail/breach-detail.component';

const routes: Routes = [
  { path: '', component: BreachListComponent },
  { path: ':name', component: BreachDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BreachManagementModule { }