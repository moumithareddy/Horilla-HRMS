import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { AttendanceService } from '../../../core/services/attendance.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';

export interface LateEarlyRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  attendance_date: string;
  attendance_type: 'Late Coming' | 'Early Leaving' | 'Both';
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string;
  actual_end: string;
  time_deviation: number; // In minutes
  reason?: string;
  status: string;
}

@Component({
  selector: 'app-late-early-records',
  templateUrl: './late-early-records.component.html',
  styleUrls: ['./late-early-records.component.scss'],
  standalone: false
})
export class LateEarlyRecordsComponent implements OnInit {
  filterForm: FormGroup;
  isLoading = false;
  today = new Date();

  // Table data
  dataSource = new MatTableDataSource<LateEarlyRecord>([]);
  displayedColumns: string[] = [
    'employee_name',
    'department',
    'attendance_date',
    'attendance_type',
    'scheduled_start',
    'actual_start',
    'scheduled_end',
    'actual_end',
    'time_deviation',
    'status',
    'reason'
  ];

  // Summary data
  totalLateRecords = 0;
  totalEarlyLeavingRecords = 0;
  totalBothTypes = 0;
  averageDeviation = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService
  ) {
    this.filterForm = this.fb.group({
      attendanceType: ['all'],
      departmentId: [''],
      employeeId: [''],
      dateRange: this.fb.group({
        start: [this.getFirstDayOfMonth()],
        end: [this.today]
      })
    });
  }

  ngOnInit(): void {
    this.loadLateEarlyRecords();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadLateEarlyRecords(): void {
    this.isLoading = true;
    
    // In a real app, this would call an API
    // Here we'll use mock data for demonstration
    setTimeout(() => {
      const mockRecords: LateEarlyRecord[] = [
        {
          id: 1,
          employee_id: 101,
          employee_name: 'John Doe',
          department: 'Engineering',
          attendance_date: '2025-05-01',
          attendance_type: 'Late Coming',
          scheduled_start: '09:00',
          scheduled_end: '18:00',
          actual_start: '09:25',
          actual_end: '18:00',
          time_deviation: 25,
          reason: 'Traffic jam',
          status: 'Unexcused'
        },
        {
          id: 2,
          employee_id: 102,
          employee_name: 'Jane Smith',
          department: 'Marketing',
          attendance_date: '2025-05-01',
          attendance_type: 'Early Leaving',
          scheduled_start: '09:00',
          scheduled_end: '18:00',
          actual_start: '09:00',
          actual_end: '17:15',
          time_deviation: 45,
          reason: 'Doctor appointment',
          status: 'Excused'
        },
        {
          id: 3,
          employee_id: 103,
          employee_name: 'Michael Johnson',
          department: 'Sales',
          attendance_date: '2025-05-01',
          attendance_type: 'Both',
          scheduled_start: '09:00',
          scheduled_end: '18:00',
          actual_start: '09:20',
          actual_end: '17:30',
          time_deviation: 50,
          status: 'Unexcused'
        },
        {
          id: 4,
          employee_id: 104,
          employee_name: 'Sarah Williams',
          department: 'HR',
          attendance_date: '2025-05-02',
          attendance_type: 'Late Coming',
          scheduled_start: '09:00',
          scheduled_end: '18:00',
          actual_start: '09:35',
          actual_end: '18:00',
          time_deviation: 35,
          reason: 'Public transport delay',
          status: 'Excused'
        },
        {
          id: 5,
          employee_id: 105,
          employee_name: 'Robert Brown',
          department: 'Engineering',
          attendance_date: '2025-05-02',
          attendance_type: 'Early Leaving',
          scheduled_start: '09:00',
          scheduled_end: '18:00',
          actual_start: '09:00',
          actual_end: '17:00',
          time_deviation: 60,
          reason: 'Family emergency',
          status: 'Excused'
        },
        {
          id: 6,
          employee_id: 101,
          employee_name: 'John Doe',
          department: 'Engineering',
          attendance_date: '2025-05-02',
          attendance_type: 'Late Coming',
          scheduled_start: '09:00',
          scheduled_end: '18:00',
          actual_start: '09:15',
          actual_end: '18:00',
          time_deviation: 15,
          status: 'Unexcused'
        },
        {
          id: 7,
          employee_id: 103,
          employee_name: 'Michael Johnson',
          department: 'Sales',
          attendance_date: '2025-05-02',
          attendance_type: 'Both',
          scheduled_start: '09:00',
          scheduled_end: '18:00',
          actual_start: '09:10',
          actual_end: '17:40',
          time_deviation: 30,
          status: 'Unexcused'
        }
      ];
      
      this.dataSource.data = mockRecords;
      this.calculateSummary(mockRecords);
      this.isLoading = false;
    }, 800);
  }

  calculateSummary(records: LateEarlyRecord[]): void {
    this.totalLateRecords = records.filter(r => r.attendance_type === 'Late Coming' || r.attendance_type === 'Both').length;
    this.totalEarlyLeavingRecords = records.filter(r => r.attendance_type === 'Early Leaving' || r.attendance_type === 'Both').length;
    this.totalBothTypes = records.filter(r => r.attendance_type === 'Both').length;
    
    // Calculate average deviation in minutes
    const totalDeviation = records.reduce((sum, record) => sum + record.time_deviation, 0);
    this.averageDeviation = totalDeviation / records.length || 0;
  }

  applyFilter(): void {
    const attendanceType = this.filterForm.get('attendanceType')?.value;
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
      this.dataSource.filterPredicate = (data: LateEarlyRecord, filter: string) => {
        // Parse the filter string
        const filterObj = JSON.parse(filter);
        
        // Check attendance type
        if (filterObj.attendanceType !== 'all' && data.attendance_type !== filterObj.attendanceType) {
          return false;
        }
        
        // Check department
        if (filterObj.departmentId && data.department !== filterObj.departmentId) {
          return false;
        }
        
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
        attendanceType: attendanceType,
        departmentId: departmentId,
        employeeId: employeeId ? parseInt(employeeId) : null,
        startDate: startDate,
        endDate: endDate
      });
      
      // Recalculate summary after filtering
      this.calculateSummary(this.dataSource.filteredData);
      
      this.isLoading = false;
    }, 500);
  }

  resetFilter(): void {
    this.filterForm.reset({
      attendanceType: 'all',
      departmentId: '',
      employeeId: '',
      dateRange: {
        start: this.getFirstDayOfMonth(),
        end: this.today
      }
    });
    
    this.dataSource.filter = '';
    this.calculateSummary(this.dataSource.data);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'excused':
        return 'status-excused';
      case 'unexcused':
        return 'status-unexcused';
      default:
        return '';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'Late Coming':
        return 'type-late';
      case 'Early Leaving':
        return 'type-early';
      case 'Both':
        return 'type-both';
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

  formatTimeDeviation(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  }
}