import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { AttendanceService } from '../../../core/services/attendance.service';
import { Attendance, AttendanceFilter, AttendanceStatus } from '../../../core/models/attendance.model';
import { AttendanceDialogComponent } from '../attendance-dialog/attendance-dialog.component';
import { AttendanceBulkUploadComponent } from '../attendance-bulk-upload/attendance-bulk-upload.component';

@Component({
  selector: 'app-attendance-list',
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.scss'],
  standalone: false
})
export class AttendanceListComponent implements OnInit {
  dataSource = new MatTableDataSource<Attendance>([]);
  filterForm: FormGroup;
  isLoading = false;
  statuses: AttendanceStatus[] = [];
  
  displayedColumns: string[] = [
    'employee_name',
    'attendance_date',
    'attendance_clock_in_time',
    'attendance_clock_out_time',
    'attendance_worked_hour',
    'attendance_status',
    'attendance_overtime_hour',
    'department_name',
    'actions'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private attendanceService: AttendanceService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      employeeId: [''],
      departmentId: [''],
      status: [''],
      dateRange: this.fb.group({
        start: [firstDayOfMonth],
        end: [today]
      })
    });
  }

  ngOnInit(): void {
    // Check if we're coming from a filter (department or location from chart clicks)
    this.route.queryParams.subscribe(params => {
      // Handle department filter
      if (params['departmentId']) {
        // Set the department filter
        this.filterForm.patchValue({
          departmentId: params['departmentId']
        });
        
        // Show notification about the applied filter
        if (params['departmentName']) {
          this.snackBar.open(`Showing attendance records for ${params['departmentName']} department`, 'Close', {
            duration: 5000
          });
        }
      }
      
      // Handle location type filter (Home/Office)
      if (params['locationType']) {
        this.snackBar.open(`Showing attendance records for ${params['locationType']} work location`, 'Close', {
          duration: 5000
        });
        // We don't set a form field for this as it's not in the standard filter form,
        // but we'll pass it through to the filter in prepareFilter()
      }
      
      // Load data after setting up filters from query params
      this.loadAttendanceStatuses();
      this.loadAttendanceData();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadAttendanceStatuses(): void {
    this.attendanceService.getAttendanceStatuses().subscribe(
      (statuses) => {
        this.statuses = statuses;
      },
      (error) => {
        console.error('Error loading attendance statuses', error);
      }
    );
  }

  loadAttendanceData(): void {
    this.isLoading = true;
    const filter: AttendanceFilter = this.prepareFilter();
    
    console.log('Loading attendance data with filter:', filter);
    
    this.attendanceService.getAttendances(filter).subscribe(
      (attendances: Attendance[]) => {
        console.log(`Received ${attendances.length} attendance records from API`);
        this.dataSource.data = attendances;
        
        // Make sure paginator is properly connected to the dataSource
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        
        this.isLoading = false;
        
        if (attendances.length === 0) {
          console.log('No attendance records found for the current filter');
        } else {
          console.log('First attendance record:', attendances[0]);
        }
      },
      (error: any) => {
        console.error('Error loading attendance data', error);
        this.isLoading = false;
      }
    );
  }

  prepareFilter(): AttendanceFilter {
    const formValue = this.filterForm.value;
    const filter: AttendanceFilter = {};
    
    if (formValue.employeeId) {
      filter.employeeId = formValue.employeeId;
    }
    
    if (formValue.departmentId) {
      filter.departmentId = formValue.departmentId;
    }
    
    if (formValue.status) {
      filter.status = formValue.status;
    }
    
    if (formValue.dateRange.start && formValue.dateRange.end) {
      filter.dateRange = {
        start: this.formatDate(formValue.dateRange.start),
        end: this.formatDate(formValue.dateRange.end)
      };
    }
    
    // Check if we have a location type filter from the URL query params
    if (this.route.snapshot.queryParams['locationType']) {
      filter.locationType = this.route.snapshot.queryParams['locationType'];
    }
    
    return filter;
  }

  applyFilter(): void {
    this.loadAttendanceData();
  }
  
  resetFilter(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm.reset({
      employeeId: '',
      departmentId: '',
      status: '',
      dateRange: {
        start: firstDayOfMonth,
        end: today
      }
    });
    
    // Remove any URL parameters to ensure location filter is cleared too
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    }).then(() => {
      this.loadAttendanceData();
    });
  }

  getStatusColor(status: string): string {
    const foundStatus = this.statuses.find(s => s.id === status);
    return foundStatus ? foundStatus.color : '#ccc';
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
  }

  deleteAttendance(id: number): void {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      this.attendanceService.deleteAttendance(id).subscribe(
        () => {
          this.snackBar.open('Attendance record deleted successfully', 'Close', {
            duration: 3000
          });
          this.loadAttendanceData();
        },
        (error) => {
          console.error('Error deleting attendance record', error);
          this.snackBar.open('Failed to delete attendance record', 'Close', {
            duration: 3000
          });
        }
      );
    }
  }
  
  // Open dialog to add attendance records (supports multi-select for employees)
  openAddSingleAttendanceDialog(): void {
    const dialogRef = this.dialog.open(AttendanceDialogComponent, {
      width: '800px',
      data: { date: this.getCurrentDate() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        const recordCount = result.count || 1;
        this.snackBar.open(`${recordCount} attendance record${recordCount > 1 ? 's' : ''} added successfully`, 'Close', {
          duration: 3000
        });
        this.loadAttendanceData();
      }
    });
  }
  
  // Helper to get current date in YYYY-MM-DD format
  private getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Open dialog for bulk upload of attendance records from Excel
  openBulkUploadDialog(): void {
    const dialogRef = this.dialog.open(AttendanceBulkUploadComponent, {
      width: '900px',
      height: '80vh',
      maxHeight: '90vh',
      data: { date: this.getCurrentDate() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        const recordCount = result.count || 0;
        this.snackBar.open(`${recordCount} attendance record${recordCount > 1 ? 's' : ''} imported successfully`, 'Close', {
          duration: 3000
        });
        
        // Force a delay before reloading to ensure backend has processed the data
        setTimeout(() => {
          console.log('Reloading attendance data after bulk upload');
          // Reset the filter to ensure we see the newly added records
          this.resetFilter();
          // Then load the data with the reset filter
          this.loadAttendanceData();
        }, 500);
      }
    });
  }
}