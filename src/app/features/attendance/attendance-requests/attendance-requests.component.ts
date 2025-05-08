import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AttendanceService } from '../../../core/services/attendance.service';
import { EmployeeService } from '../../../core/services/employee.service';

export interface AttendanceRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  request_date: string;
  request_type: string;
  request_reason: string;
  requested_date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  comments?: string;
  created_at: string;
}

@Component({
  selector: 'app-attendance-requests',
  templateUrl: './attendance-requests.component.html',
  styleUrls: ['./attendance-requests.component.scss'],
  standalone: false
})
export class AttendanceRequestsComponent implements OnInit {
  filterForm: FormGroup;
  isLoading = false;
  today = new Date();
  
  // Table data
  dataSource = new MatTableDataSource<AttendanceRequest>([]);
  displayedColumns: string[] = [
    'employee_name',
    'request_date',
    'request_type',
    'requested_date',
    'clock_in_time',
    'clock_out_time',
    'request_reason',
    'status',
    'actions'
  ];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      status: ['all'],
      employeeId: [''],
      dateRange: this.fb.group({
        start: [this.getFirstDayOfMonth()],
        end: [this.today]
      })
    });
  }

  ngOnInit(): void {
    this.loadRequests();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  loadRequests(): void {
    this.isLoading = true;
    
    // In a real app, this would call an API
    // Here we'll use mock data for demonstration
    setTimeout(() => {
      const mockRequests: AttendanceRequest[] = [
        {
          id: 1,
          employee_id: 101,
          employee_name: 'John Doe',
          request_date: '2025-05-01',
          request_type: 'Check-in Correction',
          request_reason: 'Forgot to check in',
          requested_date: '2025-04-30',
          clock_in_time: '09:15',
          status: 'Pending',
          created_at: '2025-05-01T08:30:00'
        },
        {
          id: 2,
          employee_id: 102,
          employee_name: 'Jane Smith',
          request_date: '2025-05-01',
          request_type: 'Check-out Correction',
          request_reason: 'System error during check-out',
          requested_date: '2025-04-30',
          clock_out_time: '17:45',
          status: 'Approved',
          comments: 'Approved based on system logs',
          created_at: '2025-05-01T09:15:00'
        },
        {
          id: 3,
          employee_id: 103,
          employee_name: 'Michael Johnson',
          request_date: '2025-05-01',
          request_type: 'Attendance Adjustment',
          request_reason: 'Was in a client meeting offsite',
          requested_date: '2025-04-29',
          clock_in_time: '08:30',
          clock_out_time: '18:00',
          status: 'Rejected',
          comments: 'No meeting on calendar',
          created_at: '2025-05-01T10:00:00'
        },
        {
          id: 4,
          employee_id: 104,
          employee_name: 'Sarah Williams',
          request_date: '2025-05-02',
          request_type: 'Check-in Correction',
          request_reason: 'Badge not working',
          requested_date: '2025-05-02',
          clock_in_time: '08:05',
          status: 'Pending',
          created_at: '2025-05-02T08:45:00'
        },
        {
          id: 5,
          employee_id: 105,
          employee_name: 'Robert Brown',
          request_date: '2025-05-02',
          request_type: 'Attendance Adjustment',
          request_reason: 'Working from home - approved',
          requested_date: '2025-05-02',
          clock_in_time: '09:00',
          clock_out_time: '17:30',
          status: 'Approved',
          comments: 'Pre-approved WFH',
          created_at: '2025-05-02T09:30:00'
        }
      ];
      
      this.dataSource.data = mockRequests;
      this.isLoading = false;
    }, 800);
  }
  
  applyFilter(): void {
    const status = this.filterForm.get('status')?.value;
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
      this.dataSource.filterPredicate = (data: AttendanceRequest, filter: string) => {
        // Parse the filter string
        const filterObj = JSON.parse(filter);
        
        // Check status
        if (filterObj.status !== 'all' && data.status !== filterObj.status) {
          return false;
        }
        
        // Check employee
        if (filterObj.employeeId && data.employee_id !== filterObj.employeeId) {
          return false;
        }
        
        // Check date range
        const requestDate = new Date(data.request_date);
        const startDate = new Date(filterObj.startDate);
        const endDate = new Date(filterObj.endDate);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        if (requestDate < startDate || requestDate > endDate) {
          return false;
        }
        
        return true;
      };
      
      // Apply the filter
      this.dataSource.filter = JSON.stringify({
        status: status,
        employeeId: employeeId ? parseInt(employeeId) : null,
        startDate: startDate,
        endDate: endDate
      });
      
      this.isLoading = false;
    }, 500);
  }
  
  resetFilter(): void {
    this.filterForm.reset({
      status: 'all',
      employeeId: '',
      dateRange: {
        start: this.getFirstDayOfMonth(),
        end: this.today
      }
    });
    
    this.dataSource.filter = '';
  }
  
  approveRequest(id: number): void {
    this.isLoading = true;
    
    // In a real app, this would be an API call
    setTimeout(() => {
      const index = this.dataSource.data.findIndex(req => req.id === id);
      if (index > -1) {
        const updatedData = [...this.dataSource.data];
        updatedData[index].status = 'Approved';
        updatedData[index].comments = 'Approved by admin';
        this.dataSource.data = updatedData;
        
        this.snackBar.open('Request approved successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
      
      this.isLoading = false;
    }, 600);
  }
  
  rejectRequest(id: number, reason: string): void {
    this.isLoading = true;
    
    // In a real app, this would be an API call
    setTimeout(() => {
      const index = this.dataSource.data.findIndex(req => req.id === id);
      if (index > -1) {
        const updatedData = [...this.dataSource.data];
        updatedData[index].status = 'Rejected';
        updatedData[index].comments = reason || 'Rejected by admin';
        this.dataSource.data = updatedData;
        
        this.snackBar.open('Request rejected', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
      
      this.isLoading = false;
    }, 600);
  }
  
  openCommentDialog(id: number): void {
    const reason = prompt('Enter rejection reason:');
    if (reason !== null) {
      this.rejectRequest(id, reason);
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      case 'Pending':
        return 'status-pending';
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