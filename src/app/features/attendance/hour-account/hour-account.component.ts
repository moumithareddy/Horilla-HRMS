import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AttendanceService } from '../../../core/services/attendance.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';

export interface HourRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  attendance_date: string;
  clock_in_time: string;
  clock_out_time: string;
  productive_hours: number;
  break_duration: number;
  idle_time?: number;
  overtime: number;
  status: string;
}

@Component({
  selector: 'app-hour-account',
  templateUrl: './hour-account.component.html',
  styleUrls: ['./hour-account.component.scss'],
  standalone: false
})
export class HourAccountComponent implements OnInit {
  filterForm: FormGroup;
  isLoading = false;
  today = new Date();

  // Table data
  dataSource = new MatTableDataSource<HourRecord>([]);
  displayedColumns: string[] = [
    'employee_name',
    'attendance_date',
    'clock_in_time',
    'clock_out_time',
    'productive_hours',
    'break_duration',
    'idle_time',
    'overtime',
    'status'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService
  ) {
    this.filterForm = this.fb.group({
      departmentId: [''],
      employeeId: [''],
      dateRange: this.fb.group({
        start: [this.getFirstDayOfMonth()],
        end: [this.today]
      })
    });
  }

  ngOnInit(): void {
    this.loadHourRecords();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadHourRecords(): void {
    this.isLoading = true;
    
    // In a real app, this would call an API
    // Here we'll use mock data for demonstration
    setTimeout(() => {
      const mockRecords: HourRecord[] = [
        {
          id: 1,
          employee_id: 101,
          employee_name: 'John Doe',
          attendance_date: '2025-05-01',
          clock_in_time: '09:00',
          clock_out_time: '17:30',
          productive_hours: 7.5,
          break_duration: 1.0,
          idle_time: 0.5,
          overtime: 0,
          status: 'Present'
        },
        {
          id: 2,
          employee_id: 102,
          employee_name: 'Jane Smith',
          attendance_date: '2025-05-01',
          clock_in_time: '08:45',
          clock_out_time: '18:15',
          productive_hours: 8.0,
          break_duration: 1.0,
          idle_time: 0.5,
          overtime: 0.5,
          status: 'Present'
        },
        {
          id: 3,
          employee_id: 103,
          employee_name: 'Michael Johnson',
          attendance_date: '2025-05-01',
          clock_in_time: '09:15',
          clock_out_time: '17:45',
          productive_hours: 7.0,
          break_duration: 1.0,
          idle_time: 0.5,
          overtime: 0,
          status: 'Late'
        },
        {
          id: 4,
          employee_id: 104,
          employee_name: 'Sarah Williams',
          attendance_date: '2025-05-01',
          clock_in_time: '08:30',
          clock_out_time: '16:30',
          productive_hours: 7.0,
          break_duration: 1.0,
          idle_time: 0,
          overtime: 0,
          status: 'Early Out'
        },
        {
          id: 5,
          employee_id: 105,
          employee_name: 'Robert Brown',
          attendance_date: '2025-05-01',
          clock_in_time: '09:00',
          clock_out_time: '19:00',
          productive_hours: 8.0,
          break_duration: 1.0,
          idle_time: 0,
          overtime: 1.0,
          status: 'Present'
        },
        {
          id: 6,
          employee_id: 101,
          employee_name: 'John Doe',
          attendance_date: '2025-05-02',
          clock_in_time: '08:55',
          clock_out_time: '17:45',
          productive_hours: 7.75,
          break_duration: 1.0,
          idle_time: 0.25,
          overtime: 0,
          status: 'Present'
        },
        {
          id: 7,
          employee_id: 102,
          employee_name: 'Jane Smith',
          attendance_date: '2025-05-02',
          clock_in_time: '08:50',
          clock_out_time: '18:30',
          productive_hours: 8.0,
          break_duration: 1.0,
          idle_time: 0.5,
          overtime: 0.75,
          status: 'Present'
        }
      ];
      
      this.dataSource.data = mockRecords;
      this.isLoading = false;
    }, 800);
  }

  applyFilter(): void {
    const departmentId = this.filterForm.get('departmentId')?.value;
    const employeeId = this.filterForm.get('employeeId')?.value;
    const startDate = this.formatDate(this.filterForm.get('dateRange.start')?.value);
    const endDate = this.formatDate(this.filterForm.get('dateRange.end')?.value);
    
    this.isLoading = true;
    
    // In a real app, you would call an API with these filter values
    // For this example, we'll simulate filtering on the client side
    setTimeout(() => {
      // Reset the filter first
      this.dataSource.filter = '';
      
      // Filter the data
      this.dataSource.filterPredicate = (data: HourRecord, filter: string) => {
        // Parse the filter string
        const filterObj = JSON.parse(filter);
        
        // Check employee
        if (filterObj.employeeId && data.employee_id !== filterObj.employeeId) {
          return false;
        }
        
        // Check date range
        const recordDate = new Date(data.attendance_date);
        const startDate = new Date(filterObj.startDate);
        const endDate = new Date(filterObj.endDate);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        if (recordDate < startDate || recordDate > endDate) {
          return false;
        }
        
        return true;
      };
      
      // Apply the filter
      this.dataSource.filter = JSON.stringify({
        employeeId: employeeId ? parseInt(employeeId) : null,
        startDate: startDate,
        endDate: endDate
      });
      
      this.isLoading = false;
    }, 500);
  }

  resetFilter(): void {
    this.filterForm.reset({
      departmentId: '',
      employeeId: '',
      dateRange: {
        start: this.getFirstDayOfMonth(),
        end: this.today
      }
    });
    
    this.dataSource.filter = '';
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
      case 'half day':
        return 'status-half-day';
      default:
        return '';
    }
  }

  getFirstDayOfMonth(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }
}