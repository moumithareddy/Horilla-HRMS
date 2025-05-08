import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AttendanceService } from '../../../core/services/attendance.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';

export interface WorkRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  date: string;
  project: string;
  task: string;
  work_hours: number;
  description: string;
  status: string;
}

export interface WorkReportOptions {
  format: 'PDF' | 'Excel' | 'CSV';
  reportType: 'Individual' | 'Department' | 'Project';
  dateRange: {
    start: string;
    end: string;
  };
  employeeId?: number;
  departmentId?: string;
  projectName?: string;
  includeBreakdown: boolean;
  includeSummary: boolean;
}

@Component({
  selector: 'app-work-records',
  templateUrl: './work-records.component.html',
  styleUrls: ['./work-records.component.scss'],
  standalone: false
})
export class WorkRecordsComponent implements OnInit {
  recordsFilterForm: FormGroup;
  reportFilterForm: FormGroup;
  isLoading = false;
  isGeneratingReport = false;
  today = new Date();
  
  // Tab selection
  activeTabIndex = 0;
  
  // Table data
  dataSource = new MatTableDataSource<WorkRecord>([]);
  displayedColumns: string[] = [
    'employee_name',
    'department',
    'date',
    'project',
    'task',
    'work_hours',
    'description',
    'status'
  ];
  
  // Report formats
  reportFormats = [
    { value: 'PDF', icon: 'picture_as_pdf', color: '#F44336' },
    { value: 'Excel', icon: 'table_chart', color: '#4CAF50' },
    { value: 'CSV', icon: 'format_list_numbered', color: '#2196F3' }
  ];
  
  // Report types
  reportTypes = [
    { value: 'Individual', label: 'Individual Report' },
    { value: 'Department', label: 'Department Report' },
    { value: 'Project', label: 'Project Report' }
  ];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private snackBar: MatSnackBar
  ) {
    // Initialize the record filter form
    this.recordsFilterForm = this.fb.group({
      employeeId: [''],
      departmentId: [''],
      projectName: [''],
      dateRange: this.fb.group({
        start: [this.getFirstDayOfMonth()],
        end: [this.today]
      })
    });
    
    // Initialize the report filter form
    this.reportFilterForm = this.fb.group({
      format: ['PDF'],
      reportType: ['Individual'],
      employeeId: [''],
      departmentId: [''],
      projectName: [''],
      dateRange: this.fb.group({
        start: [this.getFirstDayOfMonth()],
        end: [this.today]
      }),
      includeBreakdown: [true],
      includeSummary: [true]
    });
    
    // Add conditional validation for report type
    this.reportFilterForm.get('reportType')?.valueChanges.subscribe(reportType => {
      this.updateReportFormValidation(reportType);
    });
  }

  ngOnInit(): void {
    this.loadWorkRecords();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  loadWorkRecords(): void {
    this.isLoading = true;
    
    // In a real app, this would call an API
    // Here we'll use mock data for demonstration
    setTimeout(() => {
      const mockRecords: WorkRecord[] = [
        {
          id: 1,
          employee_id: 101,
          employee_name: 'John Doe',
          department: 'Engineering',
          date: '2025-05-01',
          project: 'Website Redesign',
          task: 'Frontend Development',
          work_hours: 7.5,
          description: 'Implemented new dashboard components',
          status: 'Completed'
        },
        {
          id: 2,
          employee_id: 102,
          employee_name: 'Jane Smith',
          department: 'Marketing',
          date: '2025-05-01',
          project: 'Q2 Campaign',
          task: 'Content Creation',
          work_hours: 6,
          description: 'Created social media content',
          status: 'In Progress'
        },
        {
          id: 3,
          employee_id: 103,
          employee_name: 'Michael Johnson',
          department: 'Sales',
          date: '2025-05-01',
          project: 'Client Acquisition',
          task: 'Client Meetings',
          work_hours: 5,
          description: 'Met with 3 potential clients',
          status: 'Completed'
        },
        {
          id: 4,
          employee_id: 104,
          employee_name: 'Sarah Williams',
          department: 'HR',
          date: '2025-05-02',
          project: 'Training Program',
          task: 'Curriculum Development',
          work_hours: 8,
          description: 'Finalized onboarding training modules',
          status: 'Completed'
        },
        {
          id: 5,
          employee_id: 105,
          employee_name: 'Robert Brown',
          department: 'Engineering',
          date: '2025-05-02',
          project: 'Mobile App',
          task: 'Bug Fixes',
          work_hours: 7,
          description: 'Fixed reported crashes and UI issues',
          status: 'Completed'
        },
        {
          id: 6,
          employee_id: 101,
          employee_name: 'John Doe',
          department: 'Engineering',
          date: '2025-05-02',
          project: 'Website Redesign',
          task: 'Backend Integration',
          work_hours: 8,
          description: 'Connected API endpoints with frontend',
          status: 'In Progress'
        },
        {
          id: 7,
          employee_id: 102,
          employee_name: 'Jane Smith',
          department: 'Marketing',
          date: '2025-05-02',
          project: 'Q2 Campaign',
          task: 'Analytics Review',
          work_hours: 4,
          description: 'Analyzed campaign performance metrics',
          status: 'Completed'
        }
      ];
      
      this.dataSource.data = mockRecords;
      this.isLoading = false;
    }, 800);
  }
  
  updateReportFormValidation(reportType: string): void {
    const employeeControl = this.reportFilterForm.get('employeeId');
    const departmentControl = this.reportFilterForm.get('departmentId');
    const projectControl = this.reportFilterForm.get('projectName');
    
    // Reset validations
    employeeControl?.clearValidators();
    departmentControl?.clearValidators();
    projectControl?.clearValidators();
    
    // Set conditional validations based on report type
    switch (reportType) {
      case 'Individual':
        employeeControl?.enable();
        departmentControl?.disable();
        projectControl?.disable();
        break;
      case 'Department':
        employeeControl?.disable();
        departmentControl?.enable();
        projectControl?.disable();
        break;
      case 'Project':
        employeeControl?.disable();
        departmentControl?.disable();
        projectControl?.enable();
        break;
    }
    
    // Update the form
    employeeControl?.updateValueAndValidity();
    departmentControl?.updateValueAndValidity();
    projectControl?.updateValueAndValidity();
  }
  
  applyRecordsFilter(): void {
    const employeeId = this.recordsFilterForm.get('employeeId')?.value;
    const departmentId = this.recordsFilterForm.get('departmentId')?.value;
    const projectName = this.recordsFilterForm.get('projectName')?.value;
    const startDate = this.formatDate(this.recordsFilterForm.get('dateRange.start')?.value);
    const endDate = this.formatDate(this.recordsFilterForm.get('dateRange.end')?.value);
    
    this.isLoading = true;
    
    // In a real app, you would call an API with these filter values
    // For this example, we'll simulate filtering on the client side
    setTimeout(() => {
      // Reset the filter first
      this.dataSource.filter = '';
      
      // Filter the data
      this.dataSource.filterPredicate = (data: WorkRecord, filter: string) => {
        // Parse the filter string
        const filterObj = JSON.parse(filter);
        
        // Check employee
        if (filterObj.employeeId && data.employee_id !== parseInt(filterObj.employeeId)) {
          return false;
        }
        
        // Check department
        if (filterObj.departmentId && data.department !== filterObj.departmentId) {
          return false;
        }
        
        // Check project
        if (filterObj.projectName && !data.project.toLowerCase().includes(filterObj.projectName.toLowerCase())) {
          return false;
        }
        
        // Check date range
        const recordDate = new Date(data.date);
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
        employeeId: employeeId,
        departmentId: departmentId,
        projectName: projectName,
        startDate: startDate,
        endDate: endDate
      });
      
      this.isLoading = false;
    }, 500);
  }
  
  resetRecordsFilter(): void {
    this.recordsFilterForm.reset({
      employeeId: '',
      departmentId: '',
      projectName: '',
      dateRange: {
        start: this.getFirstDayOfMonth(),
        end: this.today
      }
    });
    
    this.dataSource.filter = '';
  }
  
  generateReport(): void {
    this.isGeneratingReport = true;
    
    // Get report options
    const reportOptions: WorkReportOptions = {
      format: this.reportFilterForm.get('format')?.value,
      reportType: this.reportFilterForm.get('reportType')?.value,
      dateRange: {
        start: this.formatDate(this.reportFilterForm.get('dateRange.start')?.value),
        end: this.formatDate(this.reportFilterForm.get('dateRange.end')?.value)
      },
      includeBreakdown: this.reportFilterForm.get('includeBreakdown')?.value,
      includeSummary: this.reportFilterForm.get('includeSummary')?.value
    };
    
    // Add conditional parameters based on report type
    switch (reportOptions.reportType) {
      case 'Individual':
        reportOptions.employeeId = parseInt(this.reportFilterForm.get('employeeId')?.value);
        break;
      case 'Department':
        reportOptions.departmentId = this.reportFilterForm.get('departmentId')?.value;
        break;
      case 'Project':
        reportOptions.projectName = this.reportFilterForm.get('projectName')?.value;
        break;
    }
    
    // In a real app, this would call an API to generate the report
    setTimeout(() => {
      // Show success message with report details
      const reportInfo = [
        `Type: ${reportOptions.reportType} Report`,
        `Format: ${reportOptions.format}`,
        `Period: ${reportOptions.dateRange.start} to ${reportOptions.dateRange.end}`
      ];
      
      if (reportOptions.employeeId) {
        const employeeName = this.getEmployeeName(reportOptions.employeeId);
        reportInfo.push(`Employee: ${employeeName}`);
      }
      
      if (reportOptions.departmentId) {
        reportInfo.push(`Department: ${reportOptions.departmentId}`);
      }
      
      if (reportOptions.projectName) {
        reportInfo.push(`Project: ${reportOptions.projectName}`);
      }
      
      // Show success message
      this.snackBar.open(`Report generated successfully!\n${reportInfo.join('\n')}`, 'Close', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: 'multiline-snackbar'
      });
      
      this.isGeneratingReport = false;
    }, 1500);
  }
  
  resetReportForm(): void {
    this.reportFilterForm.reset({
      format: 'PDF',
      reportType: 'Individual',
      employeeId: '',
      departmentId: '',
      projectName: '',
      dateRange: {
        start: this.getFirstDayOfMonth(),
        end: this.today
      },
      includeBreakdown: true,
      includeSummary: true
    });
    
    // Update validations
    this.updateReportFormValidation('Individual');
  }
  
  // Helper function to get employee name by ID
  getEmployeeName(id: number): string {
    const employeeMap: { [key: number]: string } = {
      101: 'John Doe',
      102: 'Jane Smith',
      103: 'Michael Johnson',
      104: 'Sarah Williams',
      105: 'Robert Brown'
    };
    
    return employeeMap[id] || `Employee #${id}`;
  }
  
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'in progress':
        return 'status-in-progress';
      default:
        return '';
    }
  }
  
  onTabChange(index: number): void {
    this.activeTabIndex = index;
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