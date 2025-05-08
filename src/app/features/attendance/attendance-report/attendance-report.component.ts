import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AttendanceService } from '../../../core/services/attendance.service';
import { AttendanceReport } from '../../../core/models/attendance.model';

@Component({
  selector: 'app-attendance-report',
  templateUrl: './attendance-report.component.html',
  styleUrls: ['./attendance-report.component.scss'],
  standalone: false
})
export class AttendanceReportComponent implements OnInit {
  reportForm: FormGroup;
  recentReports: AttendanceReport[] = [];
  isLoading = false;
  isGenerating = false;
  today = new Date();
  
  reportTypes = [
    { id: 'DAILY', name: 'Daily Attendance' },
    { id: 'MONTHLY', name: 'Monthly Summary' },
    { id: 'DEPARTMENT', name: 'Department Report' },
    { id: 'EMPLOYEE', name: 'Employee Summary' },
    { id: 'OVERTIME', name: 'Overtime Report' },
    { id: 'ABSENCE', name: 'Absence Report' }
  ];
  
  reportFormats = [
    { id: 'PDF', name: 'PDF Document' },
    { id: 'EXCEL', name: 'Excel Spreadsheet' },
    { id: 'CSV', name: 'CSV File' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private snackBar: MatSnackBar
  ) {
    const firstDayOfMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    
    this.reportForm = this.fb.group({
      reportName: ['', Validators.required],
      reportType: ['DAILY', Validators.required],
      dateRange: this.fb.group({
        start: [firstDayOfMonth, Validators.required],
        end: [this.today, Validators.required]
      }),
      departmentId: [''],
      employeeId: [''],
      format: ['PDF', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRecentReports();
  }
  
  loadRecentReports(): void {
    this.isLoading = true;
    
    this.attendanceService.getAttendanceReports().subscribe(
      (reports) => {
        this.recentReports = reports;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading reports', error);
        this.isLoading = false;
      }
    );
  }
  
  generateReport(): void {
    if (this.reportForm.invalid) {
      return;
    }
    
    this.isGenerating = true;
    const formData = this.reportForm.value;
    
    const dateRange = {
      start: this.formatDate(formData.dateRange.start),
      end: this.formatDate(formData.dateRange.end)
    };
    
    const reportData: Partial<AttendanceReport> = {
      name: formData.reportName,
      dateGenerated: this.formatDate(this.today),
      dateRange: dateRange,
      type: formData.reportType,
      format: formData.format
    };
    
    this.attendanceService.generateAttendanceReport(reportData).subscribe(
      (report) => {
        this.snackBar.open('Report generated successfully', 'Close', {
          duration: 3000
        });
        this.isGenerating = false;
        this.loadRecentReports();
        
        // Reset form
        this.reportForm.get('reportName')?.reset();
      },
      (error) => {
        console.error('Error generating report', error);
        this.snackBar.open('Failed to generate report', 'Close', {
          duration: 3000
        });
        this.isGenerating = false;
      }
    );
  }
  
  deleteReport(reportId: number): void {
    if (confirm('Are you sure you want to delete this report?')) {
      this.isLoading = true;
      
      // Implement delete report functionality
      // This would call an API endpoint via a service method
      this.snackBar.open('Report deleted successfully', 'Close', {
        duration: 3000
      });
      
      // Remove the deleted report from the list
      this.recentReports = this.recentReports.filter(report => report.id !== reportId);
      this.isLoading = false;
    }
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
  
  downloadReport(reportUrl: string): void {
    // In a real application, this would trigger a file download
    window.open(reportUrl, '_blank');
  }
}