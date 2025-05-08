import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Chart } from 'chart.js';

import { AttendanceService } from '../../../core/services/attendance.service';
import { Attendance } from '../../../core/models/attendance.model';

interface EmployeeAttendanceSummary {
  employee: any;
  attendancePercentage: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  dateRange: {
    start: string;
    end: string;
  };
}

@Component({
  selector: 'app-employee-attendance',
  templateUrl: './employee-attendance.component.html',
  styleUrls: ['./employee-attendance.component.scss'],
  standalone: false
})
export class EmployeeAttendanceComponent implements OnInit, AfterViewInit {
  employees: any[] = []; // This would be populated from an API
  selectedEmployee: any = null;
  employeeForm: FormGroup;
  isLoading = false;
  employeeSummary: EmployeeAttendanceSummary | null = null;
  attendanceRecords: Attendance[] = [];
  today = new Date();
  
  @ViewChild('attendanceStatusCanvas') attendanceStatusCanvas!: ElementRef;
  @ViewChild('workHoursCanvas') workHoursCanvas!: ElementRef;
  
  attendanceStatusChart: Chart | null = null;
  workHoursChart: Chart | null = null;

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService
  ) {
    const firstDayOfMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    
    this.employeeForm = this.fb.group({
      employeeId: [''],
      dateRange: this.fb.group({
        start: [firstDayOfMonth],
        end: [this.today]
      })
    });
  }

  ngOnInit(): void {
    // In a real app, you'd fetch employees from an API
    // For now, we'll use mock data
    this.employees = [
      { id: 1, employee_first_name: 'John', employee_last_name: 'Doe', department_name: 'HR', designation: 'Manager' },
      { id: 2, employee_first_name: 'Jane', employee_last_name: 'Smith', department_name: 'Engineering', designation: 'Developer' },
      { id: 3, employee_first_name: 'Bob', employee_last_name: 'Johnson', department_name: 'Marketing', designation: 'Specialist' }
    ];
  }
  
  ngAfterViewInit(): void {
    // Charts will be initialized when employee and data are selected
  }
  
  loadEmployeeAttendance(): void {
    const formValues = this.employeeForm.value;
    const employeeId = formValues.employeeId;
    
    if (!employeeId) {
      this.selectedEmployee = null;
      this.employeeSummary = null;
      this.attendanceRecords = [];
      return;
    }
    
    this.isLoading = true;
    this.selectedEmployee = this.employees.find(emp => emp.id === employeeId);
    
    const startDate = this.formatDate(formValues.dateRange.start);
    const endDate = this.formatDate(formValues.dateRange.end);
    
    // Load employee attendance summary
    this.attendanceService.getEmployeeAttendanceSummary(employeeId, startDate, endDate)
      .subscribe(
        (summary) => {
          // In a real app, the API would return the correct EmployeeAttendanceSummary
          // For now, we'll use type assertion
          this.employeeSummary = summary as unknown as EmployeeAttendanceSummary;
          
          // Now load detailed attendance records
          this.attendanceService.getAttendances({
            employeeId: employeeId,
            dateRange: { start: startDate, end: endDate }
          }).subscribe(
              (attendances) => {
                this.attendanceRecords = attendances;
                this.isLoading = false;
                
                // Initialize charts after data is loaded
                setTimeout(() => {
                  this.initializeCharts();
                }, 100);
              },
              (error) => {
                console.error('Error loading attendance records', error);
                this.isLoading = false;
              }
            );
        },
        (error) => {
          console.error('Error loading employee summary', error);
          this.isLoading = false;
        }
      );
  }
  
  initializeCharts(): void {
    if (this.attendanceStatusCanvas && this.workHoursCanvas && this.employeeSummary) {
      this.initAttendanceStatusChart();
      this.initWorkHoursChart();
    }
  }
  
  initAttendanceStatusChart(): void {
    if (!this.employeeSummary) return;
    
    const ctx = this.attendanceStatusCanvas.nativeElement.getContext('2d');
    
    if (this.attendanceStatusChart) {
      this.attendanceStatusChart.destroy();
    }
    
    const summary = this.employeeSummary;
    
    this.attendanceStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'],
        datasets: [{
          data: [
            summary.present, 
            summary.absent, 
            summary.late, 
            summary.halfDay, 
            summary.onLeave
          ],
          backgroundColor: [
            '#4CAF50', // Present - Green
            '#F44336', // Absent - Red
            '#FFC107', // Late - Yellow
            '#2196F3', // Half Day - Blue
            '#9C27B0'  // On Leave - Purple
          ],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  initWorkHoursChart(): void {
    if (!this.attendanceRecords || this.attendanceRecords.length === 0) return;
    
    const ctx = this.workHoursCanvas.nativeElement.getContext('2d');
    
    if (this.workHoursChart) {
      this.workHoursChart.destroy();
    }
    
    // Prepare data for work hours chart
    const dates = this.attendanceRecords.map(record => 
      new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    
    const workHours = this.attendanceRecords.map(record => 
      record.attendance_worked_hour || 0
    );
    
    const overtimeHours = this.attendanceRecords.map(record => 
      record.attendance_overtime_hour || 0
    );
    
    this.workHoursChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Work Hours',
            data: workHours,
            backgroundColor: '#3F51B5',
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Overtime Hours',
            data: overtimeHours,
            backgroundColor: '#FF9800',
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            }
          }
        }
      }
    });
  }
  
  applyFilter(): void {
    this.loadEmployeeAttendance();
  }
  
  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
  }
  
  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PRESENT': return 'status-present';
      case 'ABSENT': return 'status-absent';
      case 'LATE': return 'status-late';
      case 'HALF_DAY': return 'status-half-day';
      case 'ON_LEAVE': return 'status-on-leave';
      default: return '';
    }
  }
}