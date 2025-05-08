import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AttendanceRoutingModule } from './attendance-routing.module';
import { SharedModule } from '../../shared/shared.module';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

// Feature Components
import { AttendanceDashboardComponent } from './attendance-dashboard/attendance-dashboard.component';
import { AttendanceListComponent } from './attendance-list/attendance-list.component';
import { AttendanceReportComponent } from './attendance-report/attendance-report.component';
import { EmployeeAttendanceComponent } from './employee-attendance/employee-attendance.component';
// We'll use this component in routing
// import { DepartmentAttendanceComponent } from './department-attendance/department-attendance.component';
import { AttendanceRequestsComponent } from './attendance-requests/attendance-requests.component';
import { HourAccountComponent } from './hour-account/hour-account.component';
import { LateEarlyRecordsComponent } from './late-early-records/late-early-records.component';
import { WorkRecordsComponent } from './work-records/work-records.component';
import { MyAttendanceComponent } from './my-attendance/my-attendance.component';

// Dialog Components
import { AttendanceDialogComponent } from './attendance-dialog/attendance-dialog.component';
import { DepartmentAttendanceDialogComponent } from './department-attendance-dialog/department-attendance-dialog.component';
import { AttendanceBulkUploadComponent } from './attendance-bulk-upload/attendance-bulk-upload.component';

@NgModule({
  declarations: [
    AttendanceDashboardComponent,
    AttendanceListComponent,
    AttendanceReportComponent,
    EmployeeAttendanceComponent,
    AttendanceRequestsComponent,
    HourAccountComponent,
    LateEarlyRecordsComponent,
    WorkRecordsComponent,
    MyAttendanceComponent,
    AttendanceDialogComponent,
    DepartmentAttendanceDialogComponent,
    AttendanceBulkUploadComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AttendanceRoutingModule,
    SharedModule,
    // Material Modules
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule
  ]
})
export class AttendanceModule { }