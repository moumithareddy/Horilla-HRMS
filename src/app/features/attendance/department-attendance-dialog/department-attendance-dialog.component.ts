import { Component, Inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AttendanceService } from '../../../core/services/attendance.service';
import { Attendance } from '../../../core/models/attendance.model';

export interface DepartmentAttendanceDialogData {
  departmentName: string;
  departmentId: number;
  date: string;
}

@Component({
  selector: 'app-department-attendance-dialog',
  templateUrl: './department-attendance-dialog.component.html',
  styleUrls: ['./department-attendance-dialog.component.scss'],
  standalone: false
})
export class DepartmentAttendanceDialogComponent implements OnInit, AfterViewInit {
  isLoading = true;
  departmentName: string;
  dataSource = new MatTableDataSource<Attendance>([]);
  displayedColumns: string[] = [
    'employee_name', 
    'attendance_clock_in_time', 
    'attendance_clock_out_time', 
    'attendance_worked_hour',
    'attendance_status'
  ];
  
  // Pagination options
  pageSizeOptions: number[] = [5, 10, 25];
  pageSize: number = 10;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  constructor(
    public dialogRef: MatDialogRef<DepartmentAttendanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepartmentAttendanceDialogData,
    private attendanceService: AttendanceService,
  ) {
    this.departmentName = data.departmentName;
  }

  ngOnInit(): void {
    this.loadDepartmentAttendanceData();
  }
  
  ngAfterViewInit(): void {
    // Connect the paginator to the data source after view initialization
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadDepartmentAttendanceData(): void {
    this.isLoading = true;
    
    // Log details about the data we're trying to load
    console.log('Loading attendance data with parameters:', {
      departmentId: this.data.departmentId,
      departmentName: this.data.departmentName,
      date: this.data.date
    });
    
    this.attendanceService.getAttendances({
      departmentId: this.data.departmentId,
      dateRange: {
        start: this.data.date,
        end: this.data.date
      },
      status: 'PRESENT' // Only get present employees
    }).subscribe(
      (attendances) => {
        console.log(`Retrieved ${attendances.length} records for department ID ${this.data.departmentId}`);
        this.dataSource.data = attendances;
        this.isLoading = false;
        
        // Connect the paginator to the data source after data is loaded
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      (error) => {
        console.error('Error loading department attendance data', error);
        this.isLoading = false;
      }
    );
  }

  closeDialog(): void {
    console.log('Close dialog button clicked');
    // Force close the dialog with a result to ensure it always closes
    this.dialogRef.close('closed');
    
    // Add a slight delay and try forcing again if needed
    setTimeout(() => {
      if (this.dialogRef) {
        console.log('Force closing dialog after delay');
        this.dialogRef.close('forced');
      }
    }, 100);
  }
}