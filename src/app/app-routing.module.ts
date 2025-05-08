import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'attendance',
    loadChildren: () => import('./features/attendance/attendance.module').then(m => m.AttendanceModule)
  },
  {
    path: '',
    redirectTo: 'attendance/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'attendance/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
