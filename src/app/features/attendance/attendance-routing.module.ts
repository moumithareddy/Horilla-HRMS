import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Import Components
import { AttendanceDashboardComponent } from './attendance-dashboard/attendance-dashboard.component';
import { AttendanceListComponent } from './attendance-list/attendance-list.component';
import { AttendanceReportComponent } from './attendance-report/attendance-report.component';
import { EmployeeAttendanceComponent } from './employee-attendance/employee-attendance.component';
import { AttendanceRequestsComponent } from './attendance-requests/attendance-requests.component';
import { HourAccountComponent } from './hour-account/hour-account.component';
import { LateEarlyRecordsComponent } from './late-early-records/late-early-records.component';
import { WorkRecordsComponent } from './work-records/work-records.component';
import { MyAttendanceComponent } from './my-attendance/my-attendance.component';
// Lazy-loaded as standalone component
// import { DepartmentAttendanceComponent } from './department-attendance/department-attendance.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard',
        component: AttendanceDashboardComponent
      },
      {
        path: 'list',
        component: AttendanceListComponent
      },
      {
        path: 'report',
        component: AttendanceReportComponent
      },
      {
        path: 'employee',
        component: EmployeeAttendanceComponent
      },
      {
        path: 'department',
        loadComponent: () => import('./department-attendance/department-attendance.component').then(m => m.DepartmentAttendanceComponent)
      },
      {
        path: 'requests',
        component: AttendanceRequestsComponent
      },
      {
        path: 'hour-account',
        component: HourAccountComponent
      },
      {
        path: 'late-early',
        component: LateEarlyRecordsComponent
      },
      {
        path: 'work-records',
        component: WorkRecordsComponent
      },
      {
        path: 'my-attendance',
        component: MyAttendanceComponent
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttendanceRoutingModule { }