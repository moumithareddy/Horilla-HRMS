import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatNativeDateModule } from '@angular/material/core';

import { AttendanceService } from '../../../core/services/attendance.service';
import { Attendance } from '../../../core/models/attendance.model';

@Component({
  selector: 'app-department-attendance',
  templateUrl: './department-attendance.component.html',
  styleUrls: ['./department-attendance.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatNativeDateModule
  ]
})
export class DepartmentAttendanceComponent implements OnInit, OnDestroy {
  department: string = '';
  isLoading: boolean = true;
  attendanceRecords: Attendance[] = [];
  filterForm: FormGroup;
  currentDate = new Date();
  
  displayedColumns: string[] = ['employee', 'date', 'clockIn', 'clockOut', 'status', 'hours', 'actions'];
  private subscriptions: Subscription[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private snackBar: MatSnackBar
  ) {
    // Initialize filter form with default values (today)
    this.filterForm = this.fb.group({
      dateRange: this.fb.group({
        start: [new Date()],
        end: [new Date()]
      })
    });
  }
  
  ngOnInit(): void {
    // Get the department from route query params
    this.route.queryParams.subscribe(params => {
      if (params['department']) {
        this.department = params['department'];
        this.loadDepartmentAttendance();
      } else {
        // No department specified, show snackbar and use default department
        this.snackBar.open('No department specified, showing all departments', 'Close', {
          duration: 3000
        });
        this.department = 'All Departments';
        this.loadDepartmentAttendance();
      }
    });
  }
  
  loadDepartmentAttendance(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;
    const startDate = this.formatDate(formValue.dateRange.start);
    const endDate = this.formatDate(formValue.dateRange.end);
    
    // We'll make a service call to get attendance records for this department
    // For all departments, we'll omit the department filter
    const departmentId = this.department === 'All Departments' ? 0 : this.getDepartmentId(this.department);
    
    const subscription = this.attendanceService.getDepartmentAttendanceRecords(departmentId, startDate, endDate)
      .subscribe({
        next: (records: Attendance[]) => {
          this.attendanceRecords = records;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading department attendance', error);
          this.isLoading = false;
          this.snackBar.open('Failed to load department attendance records', 'Close', {
            duration: 3000
          });
        }
      });
      
    this.subscriptions.push(subscription);
  }
  
  applyFilter(): void {
    this.loadDepartmentAttendance();
  }
  
  // Helper method to format date as YYYY-MM-DD for API calls
  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
  }
  
  // Helper method to get department ID from name (in a real app, this would be from a service)
  getDepartmentId(departmentName: string): number {
    // This is just a simple mock implementation
    const departmentMap: {[key: string]: number} = {
      'HR': 1,
      'Engineering': 2,
      'Finance': 3,
      'Marketing': 4,
      'Sales': 5
    };
    
    return departmentMap[departmentName] || 0;
  }
  
  // Calculate work hours from clock in/out times
  calculateWorkHours(clockIn: string, clockOut: string): string {
    if (!clockIn || !clockOut) {
      return '-';
    }
    
    const inTime = new Date(`2000-01-01T${clockIn}`);
    const outTime = new Date(`2000-01-01T${clockOut}`);
    
    // Calculate difference in milliseconds
    const diffMs = outTime.getTime() - inTime.getTime();
    
    // Convert to hours and minutes
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}