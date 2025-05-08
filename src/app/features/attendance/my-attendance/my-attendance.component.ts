import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval } from 'rxjs';

import { AttendanceService } from '../../../core/services/attendance.service';
import { Attendance } from '../../../core/models/attendance.model';

export interface PersonalAttendance {
  id: number;
  date: string;
  check_in: string;
  check_out: string;
  work_hours: number;
  status: string;
  overtime: number;
  location: string;
  device: string;
  notes?: string;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  earlyOut: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  averageWorkHours: number;
}

@Component({
  selector: 'app-my-attendance',
  templateUrl: './my-attendance.component.html',
  styleUrls: ['./my-attendance.component.scss'],
  standalone: false
})
export class MyAttendanceComponent implements OnInit {
  filterForm: FormGroup;
  isLoading = false;
  today = new Date();
  currentTime = new Date();
  currentMonth = this.today.toLocaleString('default', { month: 'long' });
  currentYear = this.today.getFullYear();
  isClockIn = false;
  currentAttendance: Attendance | null = null;

  // Table data
  dataSource = new MatTableDataSource<PersonalAttendance>([]);
  displayedColumns: string[] = [
    'date',
    'check_in',
    'check_out',
    'work_hours',
    'status',
    'overtime',
    'location',
    'notes'
  ];

  // Summary data
  summary: AttendanceSummary = {
    present: 0,
    absent: 0,
    late: 0,
    earlyOut: 0,
    totalWorkHours: 0,
    totalOvertimeHours: 0,
    averageWorkHours: 0
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      month: [new Date().getMonth()],
      year: [new Date().getFullYear()]
    });
    
    // Update current time every second
    interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  ngOnInit(): void {
    this.loadMyAttendance();
    this.checkAttendanceStatus();
  }
  
  // Check if the user is already clocked in
  checkAttendanceStatus(): void {
    // For mock data we'll use employee ID 1 as the current user
    const currentEmployeeId = 1;
    const today = new Date().toISOString().split('T')[0];
    
    this.attendanceService.getAttendanceRecords({
      employeeId: currentEmployeeId,
      dateRange: {
        start: today,
        end: today
      }
    }).subscribe(records => {
      if (records && records.length > 0) {
        const todayAttendance = records[0];
        this.currentAttendance = todayAttendance;
        this.isClockIn = !!todayAttendance.attendance_clock_in_time && !todayAttendance.attendance_clock_out_time;
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadMyAttendance(): void {
    this.isLoading = true;
    
    // In a real app, this would call an API
    // Here we'll use mock data for demonstration
    setTimeout(() => {
      const mockAttendance: PersonalAttendance[] = [
        {
          id: 1,
          date: '2025-05-01',
          check_in: '09:00',
          check_out: '18:00',
          work_hours: 8,
          status: 'Present',
          overtime: 0,
          location: 'Office',
          device: 'Biometric',
          notes: ''
        },
        {
          id: 2,
          date: '2025-05-02',
          check_in: '09:15',
          check_out: '18:30',
          work_hours: 8.25,
          status: 'Late',
          overtime: 0.5,
          location: 'Office',
          device: 'Biometric',
          notes: 'Traffic delay'
        },
        {
          id: 3,
          date: '2025-05-03',
          check_in: '',
          check_out: '',
          work_hours: 0,
          status: 'Weekend',
          overtime: 0,
          location: '',
          device: '',
          notes: ''
        },
        {
          id: 4,
          date: '2025-05-04',
          check_in: '',
          check_out: '',
          work_hours: 0,
          status: 'Weekend',
          overtime: 0,
          location: '',
          device: '',
          notes: ''
        },
        {
          id: 5,
          date: '2025-05-05',
          check_in: '09:00',
          check_out: '18:00',
          work_hours: 8,
          status: 'Present',
          overtime: 0,
          location: 'Office',
          device: 'Biometric',
          notes: ''
        },
        {
          id: 6,
          date: '2025-05-06',
          check_in: '09:00',
          check_out: '17:30',
          work_hours: 7.5,
          status: 'Early Out',
          overtime: 0,
          location: 'Office',
          device: 'Biometric',
          notes: 'Doctor appointment'
        },
        {
          id: 7,
          date: '2025-05-07',
          check_in: '09:00',
          check_out: '19:00',
          work_hours: 9,
          status: 'Present',
          overtime: 1,
          location: 'Office',
          device: 'Biometric',
          notes: 'Project deadline'
        },
        {
          id: 8,
          date: '2025-05-08',
          check_in: '',
          check_out: '',
          work_hours: 0,
          status: 'Absent',
          overtime: 0,
          location: '',
          device: '',
          notes: 'Sick leave'
        },
        {
          id: 9,
          date: '2025-05-09',
          check_in: '09:00',
          check_out: '18:00',
          work_hours: 8,
          status: 'Present',
          overtime: 0,
          location: 'Remote',
          device: 'Mobile App',
          notes: 'Work from home'
        },
        {
          id: 10,
          date: '2025-05-10',
          check_in: '',
          check_out: '',
          work_hours: 0,
          status: 'Weekend',
          overtime: 0,
          location: '',
          device: '',
          notes: ''
        }
      ];
      
      this.dataSource.data = mockAttendance;
      this.calculateSummary(mockAttendance);
      this.isLoading = false;
    }, 800);
  }

  calculateSummary(attendance: PersonalAttendance[]): void {
    // Reset summary
    this.summary = {
      present: 0,
      absent: 0,
      late: 0,
      earlyOut: 0,
      totalWorkHours: 0,
      totalOvertimeHours: 0,
      averageWorkHours: 0
    };
    
    // Calculate new summary
    let workDays = 0;
    
    attendance.forEach(record => {
      switch (record.status) {
        case 'Present':
          this.summary.present++;
          workDays++;
          break;
        case 'Absent':
          this.summary.absent++;
          workDays++;
          break;
        case 'Late':
          this.summary.late++;
          this.summary.present++;
          workDays++;
          break;
        case 'Early Out':
          this.summary.earlyOut++;
          this.summary.present++;
          workDays++;
          break;
      }
      
      this.summary.totalWorkHours += record.work_hours;
      this.summary.totalOvertimeHours += record.overtime;
    });
    
    // Calculate average work hours (excluding weekends/holidays)
    this.summary.averageWorkHours = workDays > 0 ? this.summary.totalWorkHours / workDays : 0;
  }

  applyFilter(): void {
    const month = this.filterForm.get('month')?.value;
    const year = this.filterForm.get('year')?.value;
    
    this.isLoading = true;
    this.currentMonth = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
    this.currentYear = year;
    
    // In a real app, this would call an API with the month/year filter
    // For now, we'll just simulate a delay and show the same data
    setTimeout(() => {
      this.loadMyAttendance();
    }, 500);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'present':
        return 'status-present';
      case 'absent':
        return 'status-absent';
      case 'late':
        return 'status-late';
      case 'early out':
        return 'status-early-out';
      case 'weekend':
      case 'holiday':
        return 'status-non-working';
      default:
        return '';
    }
  }

  formatTime(time: string): string {
    if (!time) return '-';
    return time;
  }
  
  // Clock in functionality
  clockIn(): void {
    const currentEmployeeId = 1; // For mock data we'll use employee ID 1 as the current user
    this.attendanceService.clockIn(currentEmployeeId).subscribe(
      (attendance) => {
        this.currentAttendance = attendance;
        this.isClockIn = true;
        this.snackBar.open('Successfully clocked in!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        // Refresh attendance data
        this.loadMyAttendance();
      },
      (error) => {
        console.error('Error clocking in', error);
        this.snackBar.open('Failed to clock in. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    );
  }
  
  // Clock out functionality
  clockOut(): void {
    const currentEmployeeId = 1; // For mock data we'll use employee ID 1 as the current user
    this.attendanceService.clockOut(currentEmployeeId).subscribe(
      (attendance) => {
        this.currentAttendance = attendance;
        this.isClockIn = false;
        this.snackBar.open('Successfully clocked out!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        // Refresh attendance data
        this.loadMyAttendance();
      },
      (error) => {
        console.error('Error clocking out', error);
        this.snackBar.open('Failed to clock out. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    );
  }


}