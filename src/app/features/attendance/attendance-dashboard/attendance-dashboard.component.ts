import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
// Register all Chart.js components
Chart.register(...registerables);
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { AttendanceService } from '../../../core/services/attendance.service';
import { AttendanceSummary, Attendance } from '../../../core/models/attendance.model';
import { DepartmentAttendanceDialogComponent } from '../department-attendance-dialog/department-attendance-dialog.component';

// Interface for enhanced dashboard statistics
interface EnhancedDashboardStats {
  employeeDaysAbsent: number;
  totalEmployees: number;
  sickLeave: number;
  casualLeave: number;
  preApprovedAbsences: number;
  overtimeHours: number;
  employeeDaysPresent: number;
  unscheduledDaysLeave: number;
  employeesOnProbation: number;
  attendanceRate: number;
  absenteeismRate: number;
  workLocationData: {
    home: number;
    office: number;
  };
  departmentAttendance: Array<{
    department: string;
    percentage: number;
  }>;
}

@Component({
  selector: 'app-attendance-dashboard',
  templateUrl: './attendance-dashboard.component.html',
  styleUrls: ['./attendance-dashboard.component.scss'],
  standalone: false
})
export class AttendanceDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  dashboardSummary: AttendanceSummary | null = null;
  filterForm: FormGroup;
  statsFilterPeriod = 'lastWeek'; // default filter
  isShowingCustomDatePicker = false;
  customDateRange = {
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date()
  };
  personalStats = {
    avgHours: '0h 0m',
    onTimePercentage: '0%'
  };
  teamStats = {
    avgHours: '0h 0m',
    onTimePercentage: '0%'
  };
  isLoading = true;
  currentDate = new Date();
  isClockIn = false;
  currentAttendance: Attendance | null = null;
  
  // Calendar properties
  currentMonth: Date = new Date();
  calendarDays: Array<{
    date: Date;
    otherMonth: boolean;
    today: boolean;
    selected: boolean;
  }> = [];
  selectionMode: 'start' | 'end' = 'start';
  
  // Chart references
  todayAttendanceChart: any;
  statusDistributionChart: any;
  dailyHoursChart: any;
  departmentAttendanceChart: any;
  
  // Enhanced dashboard charts
  locationChart: any;
  deptAttendanceChart: any;
  
  // Department attendance data
  departmentAttendanceData: { 
    department: string; 
    present: number; 
    absent: number; 
    late: number; 
    total: number;
  }[] = [];
  
  // Enhanced dashboard statistics
  enhancedStats: EnhancedDashboardStats = {
    employeeDaysAbsent: 296,
    totalEmployees: 28,
    sickLeave: 78,
    casualLeave: 76,
    preApprovedAbsences: 188,
    overtimeHours: 156,
    employeeDaysPresent: 1248,
    unscheduledDaysLeave: 108,
    employeesOnProbation: 8,
    attendanceRate: 83.01,
    absenteeismRate: 16.99,
    workLocationData: {
      home: 45.43,
      office: 54.57
    },
    departmentAttendance: [
      { department: 'Finance', percentage: 94.7 },
      { department: 'IT', percentage: 91.0 },
      { department: 'Sales', percentage: 85.3 },
      { department: 'Human Resources', percentage: 82.0 },
      { department: 'Marketing', percentage: 81.3 },
      { department: 'Administration', percentage: 81.2 },
      { department: 'Customer Support', percentage: 80.1 },
      { department: 'Accounting', percentage: 63.5 }
    ]
  };
  
  // Department filter
  selectedDepartment: string = 'All';
  
  // Subscriptions to track for cleanup
  private subscriptions: Subscription[] = [];
  
  // Original chart canvases
  @ViewChild('todayAttendanceCanvas') todayAttendanceCanvas!: ElementRef;
  @ViewChild('statusDistributionCanvas') statusDistributionCanvas!: ElementRef;
  @ViewChild('dailyHoursCanvas') dailyHoursCanvas!: ElementRef;
  @ViewChild('departmentAttendanceCanvas') departmentAttendanceCanvas!: ElementRef;
  
  // Enhanced dashboard chart canvases
  @ViewChild('locationChartCanvas') locationChartCanvas!: ElementRef;
  @ViewChild('deptAttendanceChartCanvas') deptAttendanceChartCanvas!: ElementRef;
  
  constructor(
    private attendanceService: AttendanceService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      dateRange: this.fb.group({
        start: [this.getFirstDayOfMonth()],
        end: [this.currentDate]
      })
    });
    // No longer updating time as we removed the time display from header
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadAttendanceStats();
    this.checkAttendanceStatus();
    this.generateCalendarDays();
  }
  
  setStatsFilterPeriod(period: string): void {
    this.statsFilterPeriod = period;
    this.isShowingCustomDatePicker = period === 'custom';
    
    // Set date range based on selected period
    const today = new Date();
    let startDate: Date;
    
    switch(period) {
      case 'lastWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'lastMonth':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'custom':
        // Don't update dates for custom - will be set by datepicker
        return;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
    }
    
    this.customDateRange = {
      start: startDate,
      end: today
    };
    
    this.loadAttendanceStats();
  }
  
  applyCustomDateRange(): void {
    this.loadAttendanceStats();
    this.isShowingCustomDatePicker = false;
  }
  
  loadAttendanceStats(): void {
    // Using same date range from filter
    const startDate = this.formatDate(this.customDateRange.start);
    const endDate = this.formatDate(this.customDateRange.end);
    
    // For demo purposes, we'll simulate API calls and use realistic data
    // In a real app, these would be actual API calls to get user/team stats
    
    // Simulate personal stats calculation
    this.calculatePersonalStats(startDate, endDate);
    
    // Simulate team stats calculation
    this.calculateTeamStats(startDate, endDate);
  }
  
  ngAfterViewInit(): void {
    // Improved chart initialization with better error handling and retries
    let retryCount = 0;
    const maxRetries = 3;
    
    const initCharts = () => {
      console.log('Attempting to initialize charts... (attempt ' + (retryCount + 1) + ')');
      
      // Check for both original and enhanced dashboard chart elements
      const todayCanvas = this.todayAttendanceCanvas?.nativeElement;
      const statusCanvas = this.statusDistributionCanvas?.nativeElement;
      const deptCanvas = this.departmentAttendanceCanvas?.nativeElement;
      const hoursCanvas = this.dailyHoursCanvas?.nativeElement;
      const locationCanvas = this.locationChartCanvas?.nativeElement;
      const deptAttCanvas = this.deptAttendanceChartCanvas?.nativeElement;
      
      // Only require the original charts for backward compatibility
      if (todayCanvas && statusCanvas && deptCanvas && hoursCanvas) {
        console.log('All canvas elements found, initializing charts...');
        try {
          this.initializeCharts();
        } catch (error) {
          console.error('Error initializing charts:', error);
          retryIfNeeded();
        }
      } else {
        console.warn('One or more canvas elements not available!');
        console.log('Today canvas:', !!todayCanvas);
        console.log('Status canvas:', !!statusCanvas);
        console.log('Department canvas:', !!deptCanvas);
        console.log('Hours canvas:', !!hoursCanvas);
        console.log('Location canvas:', !!locationCanvas);
        console.log('Dept Attendance canvas:', !!deptAttCanvas);
        retryIfNeeded();
      }
    };
    
    const retryIfNeeded = () => {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying chart initialization in ${500 * retryCount}ms...`);
        setTimeout(initCharts, 500 * retryCount);
      } else {
        console.error('Failed to initialize charts after multiple attempts');
      }
    };
    
    // Start the initialization process with an initial delay
    setTimeout(initCharts, 500);
  }
  
  // Handle department selection change
  onDepartmentChange(): void {
    console.log('Department changed to:', this.selectedDepartment);
    
    // Simple simulation of filtering stats by department
    if (this.selectedDepartment !== 'All') {
      // Adjust stats randomly based on department selection (for demo purposes)
      const adjustmentFactor = Math.random() * 0.3 + 0.8; // 0.8 to 1.1
      
      this.enhancedStats = {
        ...this.enhancedStats,
        employeeDaysAbsent: Math.round(this.enhancedStats.employeeDaysAbsent * adjustmentFactor),
        totalEmployees: Math.round(this.enhancedStats.totalEmployees * (0.2 + Math.random() * 0.3)), // 20-50% of total
        sickLeave: Math.round(this.enhancedStats.sickLeave * adjustmentFactor),
        casualLeave: Math.round(this.enhancedStats.casualLeave * adjustmentFactor),
        preApprovedAbsences: Math.round(this.enhancedStats.preApprovedAbsences * adjustmentFactor),
        overtimeHours: Math.round(this.enhancedStats.overtimeHours * adjustmentFactor),
        employeeDaysPresent: Math.round(this.enhancedStats.employeeDaysPresent * adjustmentFactor),
        unscheduledDaysLeave: Math.round(this.enhancedStats.unscheduledDaysLeave * adjustmentFactor),
        employeesOnProbation: Math.round(this.enhancedStats.employeesOnProbation * (0.2 + Math.random() * 0.3)),
      };
      
      // Update charts with filtered data
      if (this.deptAttendanceChart) {
        // Filter to only show selected department with higher percentage
        const filteredDepts = this.enhancedStats.departmentAttendance.filter(
          d => d.department === this.selectedDepartment || Math.random() > 0.7
        );
        
        const departments = filteredDepts.map(d => d.department);
        const percentages = filteredDepts.map(d => d.percentage);
        
        this.deptAttendanceChart.data.labels = departments;
        this.deptAttendanceChart.data.datasets[0].data = percentages;
        this.deptAttendanceChart.update();
      }
    } else {
      // Reset to original values
      this.loadDashboardData();
      
      // Re-initialize charts
      setTimeout(() => {
        this.initLocationChart();
        this.initEnhancedDeptAttendanceChart();
      }, 100);
    }
  }
  
  // Check if the user is already clocked in
  checkAttendanceStatus(): void {
    // For mock data we'll use employee ID 1 as the current user
    const currentEmployeeId = 1;
    const today = this.formatDate(new Date());
    
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
  
  loadDashboardData(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;
    const startDate = this.formatDate(formValue.dateRange.start);
    const endDate = this.formatDate(formValue.dateRange.end);
    
    this.attendanceService.getDepartmentAttendanceSummary(0, startDate, endDate)
      .subscribe(
        (summary) => {
          this.dashboardSummary = summary;
          this.isLoading = false;
          
          // Update charts with new data
          if (this.todayAttendanceChart && this.statusDistributionChart && this.dailyHoursChart) {
            this.updateCharts();
          }
        },
        (error) => {
          console.error('Error loading attendance summary', error);
          this.isLoading = false;
        }
      );
  }
  
  initializeCharts(): void {
    // Initialize original charts (kept for backward compatibility)
    this.initTodayAttendanceChart();
    this.initStatusDistributionChart();
    this.initDepartmentAttendanceChart();
    this.initDailyHoursChart();
    this.loadDepartmentData();
    
    // Initialize new enhanced dashboard charts
    this.initLocationChart();
    this.initEnhancedDeptAttendanceChart();
    // Removed gauge charts as requested
  }
  
  // Initialize location chart (donut chart)
  initLocationChart(): void {
    try {
      if (!this.locationChartCanvas || !this.locationChartCanvas.nativeElement) {
        console.warn('Location chart canvas not available');
        return;
      }
      
      const canvas = this.locationChartCanvas.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get 2D context for location chart canvas');
        return;
      }
      
      if (this.locationChart) {
        this.locationChart.destroy();
      }
      
      // Add the chart labels here so we can reference them in the click handler
      const locationLabels = ['Home', 'Office'];
      
      this.locationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: locationLabels,
          datasets: [{
            data: [this.enhancedStats.workLocationData.home, this.enhancedStats.workLocationData.office],
            backgroundColor: ['#FF5A5A', '#842777'],
            borderWidth: 0,
            hoverBackgroundColor: ['#FF7A7A', '#9D3D8F'], // Brighter colors on hover for visual feedback
            hoverBorderWidth: 2,
            hoverBorderColor: ['#ffffff', '#ffffff']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          onClick: (event, elements) => {
            // Handle click on chart segments
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              if (index !== undefined && index >= 0 && index < locationLabels.length) {
                const locationType = locationLabels[index];
                // Navigate to attendance list with location filter
                this.navigateToLocationAttendance(locationType);
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed}%`;
                }
              }
            }
          },
          // Make the chart elements more interactive
          elements: {
            arc: {
              borderWidth: 0,
              // Increase the radius slightly on hover for a more clickable feel
              hoverOffset: 8
            }
          }
        }
      });
      
      // Add direct click event listener to canvas for more reliable click detection
      canvas.onclick = (e: MouseEvent) => {
        const activePoints = this.locationChart.getElementsAtEventForMode(
          e, 
          'nearest', 
          { intersect: true }, 
          false
        );
        
        if (activePoints.length > 0) {
          const clickedElementIndex = activePoints[0].index;
          const label = locationLabels[clickedElementIndex];
          this.navigateToLocationAttendance(label);
        }
      };
      
      console.log('Location Chart created successfully with enhanced click handler');
    } catch (error) {
      console.error('Error initializing location chart:', error);
    }
  }
  
  // Navigate to attendance list filtered by location (Home/Office)
  navigateToLocationAttendance(locationType: string): void {
    console.log(`Navigating to location attendance: ${locationType}`);
    
    // Navigate to attendance list with location filter
    this.router.navigate(['/attendance/list'], { 
      queryParams: { 
        locationType: locationType
      } 
    });
    
    // Show notification
    this.snackBar.open(`Viewing attendance records for ${locationType} location`, 'Close', {
      duration: 3000
    });
  }
  
  // Initialize enhanced department attendance chart (horizontal bar chart)
  initEnhancedDeptAttendanceChart(): void {
    try {
      if (!this.deptAttendanceChartCanvas || !this.deptAttendanceChartCanvas.nativeElement) {
        console.warn('Department attendance chart canvas not available');
        return;
      }
      
      const canvas = this.deptAttendanceChartCanvas.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get 2D context for department attendance chart canvas');
        return;
      }
      
      if (this.deptAttendanceChart) {
        this.deptAttendanceChart.destroy();
      }
      
      const departments = this.enhancedStats.departmentAttendance.map(d => d.department);
      const percentages = this.enhancedStats.departmentAttendance.map(d => d.percentage);
      
      this.deptAttendanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: departments,
          datasets: [{
            data: percentages,
            backgroundColor: '#4897D8',
            borderColor: '#4897D8',
            borderWidth: 0,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          onClick: (event, elements) => {
            // Handle click on chart segments
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              if (index !== undefined && index >= 0 && index < departments.length) {
                const departmentName = departments[index];
                // Open dialog with department attendance details
                this.openDepartmentAttendanceDialog(departmentName);
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: false,
              }
            },
            x: {
              beginAtZero: true,
              max: 120,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.parsed.x.toFixed(2)}%`;
                }
              }
            }
          }
        }
      });
      
      // Make the canvas clickable with a custom click handler for improved UX
      canvas.onclick = (e: MouseEvent) => {
        const activePoints = this.deptAttendanceChart.getElementsAtEventForMode(
          e, 'nearest', {intersect: true}, false
        );
        
        if (activePoints && activePoints.length > 0) {
          const clickedIndex = activePoints[0].index;
          if (clickedIndex !== undefined && clickedIndex >= 0 && clickedIndex < departments.length) {
            const departmentName = departments[clickedIndex];
            this.openDepartmentAttendanceDialog(departmentName);
          }
        }
      };
      
      console.log('Department Attendance Chart created successfully with click handlers');
    } catch (error) {
      console.error('Error initializing enhanced department attendance chart:', error);
    }
  }
  
  // Open dialog with department attendance details
  openDepartmentAttendanceDialog(departmentName: string): void {
    console.log(`Opening attendance dialog for department: ${departmentName}`);
    
    // Convert department name if needed to match our data records
    let effectiveDepartmentName = departmentName;
    if (departmentName === 'Human Resources') {
      effectiveDepartmentName = 'HR';
    }
    
    // Use the effective department name for finding ID
    const departmentId = this.getDepartmentId(effectiveDepartmentName);
    const currentDate = this.formatDate(new Date());
    
    console.log(`Using department name: ${effectiveDepartmentName}, ID: ${departmentId}`);
    
    // First close any existing dialogs
    this.dialog.closeAll();
    
    // Create dialog ref with improved config
    const dialogRef = this.dialog.open(DepartmentAttendanceDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      panelClass: 'department-dialog-panel',
      restoreFocus: true,
      closeOnNavigation: true,
      data: {
        departmentName: departmentName, // Keep original name for display
        departmentId: departmentId,
        date: currentDate
      }
    });
    
    // Add event listeners for close
    dialogRef.backdropClick().subscribe(() => {
      dialogRef.close('backdrop');
    });
    
    dialogRef.afterClosed().subscribe(result => {
      console.log('Department dialog closed with result:', result);
    });
  }
  
  // Note: Gauge charts have been removed as requested by the user
  // and replaced with simple static percentage cards
  
  // Load department attendance data
  loadDepartmentData(): void {
    // In a real application, this would be an API call
    // For demo purposes, we'll use mock data
    
    this.departmentAttendanceData = [
      { 
        department: 'HR', 
        present: 5, 
        absent: 1, 
        late: 0,
        total: 6
      },
      { 
        department: 'Engineering', 
        present: 12, 
        absent: 2, 
        late: 1,
        total: 15
      },
      { 
        department: 'Finance', 
        present: 4, 
        absent: 0, 
        late: 1,
        total: 5
      },
      { 
        department: 'Marketing', 
        present: 6, 
        absent: 1, 
        late: 0,
        total: 7
      },
      { 
        department: 'Sales', 
        present: 8, 
        absent: 1, 
        late: 1,
        total: 10
      }
    ];
    
    // Update the department chart after a short delay to ensure it's initialized
    setTimeout(() => {
      this.updateDepartmentChart();
    }, 100);
  }
  
  // Update department chart when employee clocks in/out
  updateDepartmentData(employeeId: number, department: string, status: string): void {
    // Find the department in our data
    const deptIndex = this.departmentAttendanceData.findIndex(d => d.department === department);
    
    if (deptIndex >= 0) {
      // Update the department data based on status
      if (status === 'PRESENT') {
        this.departmentAttendanceData[deptIndex].present++;
      } else if (status === 'LATE') {
        this.departmentAttendanceData[deptIndex].late++;
      }
      
      // Update the department chart
      this.updateDepartmentChart();
    }
  }
  
  updateCharts(): void {
    // Update today's attendance chart (now showing department present counts)
    if (this.todayAttendanceChart) {
      // Extract present counts from department data
      const presentData = this.departmentAttendanceData.map(d => d.present);
      const departmentLabels = this.departmentAttendanceData.map(d => d.department);
      
      this.todayAttendanceChart.data.labels = departmentLabels;
      this.todayAttendanceChart.data.datasets[0].data = presentData;
      this.todayAttendanceChart.update();
    }
    
    // Update status distribution chart
    if (this.statusDistributionChart) {
      // Mock data for status distribution
      const statusData = [
        this.dashboardSummary?.present || 20, // Present
        this.dashboardSummary?.absent || 3,   // Absent
        this.dashboardSummary?.late || 2,     // Late
        this.dashboardSummary?.halfDay || 0   // Half Day
      ];
      
      this.statusDistributionChart.data.datasets[0].data = statusData;
      this.statusDistributionChart.update();
    }
    
    // Update department chart
    this.updateDepartmentChart();
    
    // Update daily hours chart
    if (this.dailyHoursChart) {
      // Mock data for daily work hours
      const workHoursData = [7.5, 8, 8.5, 7.75, 8, 0, 0]; // Work hours for last 7 days
      const overtimeHoursData = [0.5, 0, 1, 0, 0.5, 0, 0]; // Overtime hours for last 7 days
      
      this.dailyHoursChart.data.datasets[0].data = workHoursData;
      this.dailyHoursChart.data.datasets[1].data = overtimeHoursData;
      this.dailyHoursChart.update();
    }
  }
  
  // Update department attendance chart
  updateDepartmentChart(): void {
    if (this.departmentAttendanceChart) {
      // Convert department data to chart format
      const departments = this.departmentAttendanceData.map(d => d.department);
      const presentData = this.departmentAttendanceData.map(d => d.present);
      const absentData = this.departmentAttendanceData.map(d => d.absent);
      const lateData = this.departmentAttendanceData.map(d => d.late);
      
      this.departmentAttendanceChart.data.labels = departments;
      this.departmentAttendanceChart.data.datasets[0].data = presentData;
      this.departmentAttendanceChart.data.datasets[1].data = absentData;
      this.departmentAttendanceChart.data.datasets[2].data = lateData;
      this.departmentAttendanceChart.update();
    }
  }
  
  // Simple method to navigate to department attendance list
  navigateToDepartmentAttendance(departmentName: string): void {
    console.log(`Navigating to department: ${departmentName}`);
    
    // Convert department name if needed to match our data records
    let effectiveDepartmentName = departmentName;
    if (departmentName === 'Human Resources') {
      effectiveDepartmentName = 'HR';
    }
    
    const departmentId = this.getDepartmentId(effectiveDepartmentName);
    
    // Navigate to attendance list with department filter
    this.router.navigate(['/attendance/list'], { 
      queryParams: { 
        departmentId: departmentId,
        departmentName: departmentName // Keep original name for display
      } 
    });
    
    // Show notification
    this.snackBar.open(`Viewing ${departmentName} department attendance records`, 'Close', {
      duration: 3000
    });
  }
  
  initTodayAttendanceChart(): void {
    try {
      // First make sure we have a valid canvas element
      if (!this.todayAttendanceCanvas || !this.todayAttendanceCanvas.nativeElement) {
        console.error('Today attendance canvas not available');
        return;
      }
      
      // Get canvas rendering context
      const canvas = this.todayAttendanceCanvas.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get 2D context for today attendance canvas');
        return;
      }
      
      // If a chart already exists, destroy it first to avoid duplicates
      if (this.todayAttendanceChart) {
        this.todayAttendanceChart.destroy();
      }
      
      console.log('Creating Today Attendance Chart...');
      
      // Department present count - using the same data from departmentAttendanceData
      // This will be updated when the departmentAttendanceData is loaded
      const departmentLabels = ['HR', 'Engineering', 'Finance', 'Marketing', 'Sales'];
      const presentCounts = [5, 12, 4, 6, 8]; // Initial present counts
      const backgroundColors = [
        '#4CAF50', '#3F51B5', '#FF9800', '#9C27B0', '#E91E63',
        '#2196F3', '#607D8B', '#795548', '#00BCD4', '#CDDC39'
      ];
      
      // Add click handler to navigate to attendance list with department filter
      const chartClickHandler = (event: any, elements: any) => {
        if (elements && elements.length > 0) {
          const index = elements[0].index;
          const departmentName = departmentLabels[index];
          // Get department ID from name
          const departmentId = this.getDepartmentId(departmentName);
          
          // Navigate to attendance list with department filter
          this.router.navigate(['/attendance/list'], { 
            queryParams: { 
              departmentId: departmentId,
              departmentName: departmentName
            } 
          });
        }
      };
      
      // Initialize today's attendance chart as department pie chart
      this.todayAttendanceChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: departmentLabels,
          datasets: [{
            data: presentCounts,
            backgroundColor: backgroundColors.slice(0, departmentLabels.length),
            hoverOffset: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: chartClickHandler, // Add click handler for navigation
          plugins: {
            title: {
              display: true,
              text: 'Today\'s Attendance by Department',
              font: { size: 14 }
            },
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                padding: 10
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
      
      console.log('Today Attendance Chart created successfully');
    } catch (error) {
      console.error('Error initializing Today Attendance chart:', error);
    }
  }
  
  initStatusDistributionChart(): void {
    // Initialize status distribution pie chart
    const ctx = this.statusDistributionCanvas.nativeElement.getContext('2d');
    this.statusDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Absent', 'Late', 'Half Day'],
        datasets: [{
          data: [0, 0, 0, 0], // Will be updated with real data
          backgroundColor: ['#4CAF50', '#F44336', '#FFC107', '#2196F3'],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  initDailyHoursChart(): void {
    // Initialize daily hours line chart
    const ctx = this.dailyHoursCanvas.nativeElement.getContext('2d');
    this.dailyHoursChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.getLast7Days(),
        datasets: [
          {
            label: 'Work Hours',
            data: [0, 0, 0, 0, 0, 0, 0], // Will be updated with real data
            borderColor: '#3F51B5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Overtime Hours',
            data: [0, 0, 0, 0, 0, 0, 0], // Will be updated with real data
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4,
            fill: true
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
    this.loadDashboardData();
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  
  // Clock-in method
  handleClockIn(): void {
    // Use employee ID 1 for the current user (for mockup purposes)
    const employeeId = 1;
    const department = 'Engineering'; // For demo, assume the employee is in Engineering department
    
    const subscription = this.attendanceService.clockIn(employeeId).subscribe(
      (result) => {
        this.currentAttendance = result;
        this.isClockIn = false; // Switch to clock-out mode
        
        // Update the department attendance data
        this.updateDepartmentData(employeeId, department, 'PRESENT');
        
        // Update today's attendance chart - find the department index
        if (this.todayAttendanceChart) {
          const departmentLabels = this.todayAttendanceChart.data.labels as string[];
          const deptIndex = departmentLabels.findIndex(d => d === department);
          
          if (deptIndex >= 0) {
            // Update the specific department's present count
            const data = [...this.todayAttendanceChart.data.datasets[0].data] as number[];
            data[deptIndex]++; // Increment the present count for this department
            this.todayAttendanceChart.data.datasets[0].data = data;
            this.todayAttendanceChart.update();
          }
        }
        
        this.snackBar.open('Successfully clocked in', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      (error) => {
        console.error('Error clocking in', error);
        this.snackBar.open('Failed to clock in', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    );
    
    this.subscriptions.push(subscription);
  }
  
  // Clock-out method
  handleClockOut(): void {
    // Use employee ID 1 for the current user (for mockup purposes)
    const employeeId = 1;
    
    const subscription = this.attendanceService.clockOut(employeeId).subscribe(
      (result) => {
        this.currentAttendance = result;
        this.isClockIn = true; // Switch to clock-in mode
        
        // No need to update attendance charts as we're just clocking out
        // The employee is already counted in the attendance
        
        this.snackBar.open('Successfully clocked out', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      (error) => {
        console.error('Error clocking out', error);
        this.snackBar.open('Failed to clock out', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    );
    
    this.subscriptions.push(subscription);
  }
  
  // Initialize department attendance chart
  initDepartmentAttendanceChart(): void {
    try {
      // First make sure we have a valid canvas element
      if (!this.departmentAttendanceCanvas || !this.departmentAttendanceCanvas.nativeElement) {
        console.error('Department attendance canvas not available');
        return;
      }
      
      // Get canvas rendering context
      const canvas = this.departmentAttendanceCanvas.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get 2D context for department attendance canvas');
        return;
      }
      
      // If a chart already exists, destroy it first to avoid duplicates
      if (this.departmentAttendanceChart) {
        this.departmentAttendanceChart.destroy();
      }
      
      console.log('Creating Department Attendance Chart...');
      
      // Create department labels
      const departmentLabels = ['HR', 'Engineering', 'Finance', 'Marketing', 'Sales'];
      
      // Create the chart with meaningful sample data
      this.departmentAttendanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: departmentLabels,
          datasets: [
            {
              label: 'Present',
              data: [18, 32, 15, 22, 26],
              backgroundColor: '#4CAF50',
              borderColor: '#4CAF50',
              borderWidth: 1
            },
            {
              label: 'Absent',
              data: [2, 4, 3, 5, 3],
              backgroundColor: '#F44336',
              borderColor: '#F44336',
              borderWidth: 1
            },
            {
              label: 'Late',
              data: [4, 6, 2, 3, 5],
              backgroundColor: '#FFC107',
              borderColor: '#FFC107',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (event, activeElements) => {
            // Handle click on chart
            if (activeElements && activeElements.length > 0) {
              const index = activeElements[0].index;
              if (index !== undefined && index >= 0 && index < departmentLabels.length) {
                const departmentName = departmentLabels[index];
                // Navigate to department attendance
                this.navigateToDepartmentAttendance(departmentName);
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Attendance by Department'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${value}`;
                }
              }
            }
          }
        }
      });
      
      // Add a direct click handler to the canvas as a backup
      canvas.onclick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('Canvas clicked at position:', x, y);
        
        // Get the click position relative to the chart
        const xAxisPosition = (x / canvas.width) * departmentLabels.length;
        // Round to get the nearest department index (simple approach)
        const deptIndex = Math.floor(xAxisPosition);
        
        if (deptIndex >= 0 && deptIndex < departmentLabels.length) {
          const departmentName = departmentLabels[deptIndex];
          console.log(`Clicked near department: ${departmentName}`);
          // Navigate to department attendance
          this.navigateToDepartmentAttendance(departmentName);
        }
      };
      
      console.log('Department Attendance Chart created successfully with click handlers');
    } catch (error) {
      console.error('Error initializing Department Attendance chart:', error);
    }
  }
  
  // Cleanup subscriptions when component is destroyed
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    
    // Destroy charts to prevent memory leaks
    if (this.todayAttendanceChart) {
      this.todayAttendanceChart.destroy();
    }
    if (this.statusDistributionChart) {
      this.statusDistributionChart.destroy();
    }
    if (this.departmentAttendanceChart) {
      this.departmentAttendanceChart.destroy();
    }
    if (this.dailyHoursChart) {
      this.dailyHoursChart.destroy();
    }
  }

  // Helper methods
  getFirstDayOfMonth(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  
  // Get department ID from department name
  getDepartmentId(departmentName: string): number {
    const departmentMap: {[key: string]: number} = {
      'HR': 1,
      'Engineering': 2,
      'Finance': 3,
      'Marketing': 4,
      'Sales': 5,
      'Human Resources': 1, // Map to same ID as HR
      'IT': 7,
      'Administration': 8,
      'Customer Support': 9,
      'Accounting': 10
    };
    
    return departmentMap[departmentName] || 0;
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
  
  getLast7Days(): string[] {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    }
    return result;
  }
  
  /**
   * Calculate personal attendance stats for the selected period
   */
  calculatePersonalStats(startDate: string, endDate: string): void {
    // In a real application, this would be an API call
    // For demo purposes, we're simulating the response based on date range
    
    // Get the number of days in the range to calculate realistic averages
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Simulating response - stats vary slightly based on selected period
    if (this.statsFilterPeriod === 'lastWeek') {
      this.personalStats = {
        avgHours: '11h 26m',
        onTimePercentage: '100%'
      };
    } else if (this.statsFilterPeriod === 'lastMonth') {
      this.personalStats = {
        avgHours: '10h 42m',
        onTimePercentage: '92%'
      };
    } else {
      // Custom date range or default - calculate reasonable values
      // Assuming 8-12 hours per day with some randomness
      const totalHours = dayDiff * (9 + Math.random() * 3);
      const hours = Math.floor(totalHours / dayDiff);
      const minutes = Math.floor((totalHours / dayDiff - hours) * 60);
      
      const onTimePercentage = Math.floor(85 + Math.random() * 15);
      
      this.personalStats = {
        avgHours: `${hours}h ${minutes}m`,
        onTimePercentage: `${onTimePercentage}%`
      };
    }
  }
  
  /**
   * Calculate team attendance stats for the selected period
   */
  calculateTeamStats(startDate: string, endDate: string): void {
    // In a real application, this would be an API call
    // For demo purposes, we're simulating the response based on date range
    
    // Get the number of days in the range to calculate realistic averages
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Simulating response - stats vary slightly based on selected period
    if (this.statsFilterPeriod === 'lastWeek') {
      this.teamStats = {
        avgHours: '11h 13m',
        onTimePercentage: '54%'
      };
    } else if (this.statsFilterPeriod === 'lastMonth') {
      this.teamStats = {
        avgHours: '10h 08m',
        onTimePercentage: '62%'
      };
    } else {
      // Custom date range or default - calculate reasonable values
      // Assuming 8-10 hours per day with some randomness
      const totalHours = dayDiff * (8 + Math.random() * 2);
      const hours = Math.floor(totalHours / dayDiff);
      const minutes = Math.floor((totalHours / dayDiff - hours) * 60);
      
      const onTimePercentage = Math.floor(45 + Math.random() * 25);
      
      this.teamStats = {
        avgHours: `${hours}h ${minutes}m`,
        onTimePercentage: `${onTimePercentage}%`
      };
    }
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

  // Calendar methods
  
  /**
   * Toggle date picker visibility
   */
  toggleDatePicker(event?: MouseEvent): void {
    this.isShowingCustomDatePicker = !this.isShowingCustomDatePicker;
    if (this.isShowingCustomDatePicker) {
      this.generateCalendarDays();
      
      // Position the dropdown properly when it's opened
      if (event) {
        // Slight delay to ensure the DOM has updated
        setTimeout(() => {
          const calendarDropdowns = document.querySelectorAll('.calendar-dropdown');
          if (calendarDropdowns && calendarDropdowns.length > 0) {
            const dropdown = calendarDropdowns[0] as HTMLElement;
            
            // Get the position of the clicked element
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            
            // Calculate position
            dropdown.style.position = 'fixed';
            dropdown.style.top = (rect.bottom + 10) + 'px';
            dropdown.style.left = rect.left + 'px';
          }
        }, 10);
      }
    }
  }
  
  /**
   * Get displayed date period for the dropdown
   */
  getDisplayedDatePeriod(): string {
    switch(this.statsFilterPeriod) {
      case 'lastWeek':
        return 'Last Week';
      case 'lastMonth':
        return 'Last Month';
      case 'custom':
        return `${this.formatDisplayDate(this.customDateRange.start)} - ${this.formatDisplayDate(this.customDateRange.end)}`;
      default:
        return 'Last Week';
    }
  }
  
  /**
   * Format date for display
   */
  formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  /**
   * Go to previous month in calendar
   */
  prevMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.generateCalendarDays();
  }
  
  /**
   * Go to next month in calendar
   */
  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.generateCalendarDays();
  }
  
  /**
   * Generate calendar days for the current month
   */
  generateCalendarDays(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Array to hold all calendar days
    const days: Array<{
      date: Date;
      otherMonth: boolean;
      today: boolean;
      selected: boolean;
    }> = [];
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add days from the previous month to fill the first row
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        otherMonth: true,
        today: this.isToday(date),
        selected: this.isSelected(date)
      });
    }
    
    // Add days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        otherMonth: false,
        today: this.isToday(date),
        selected: this.isSelected(date)
      });
    }
    
    // Add days from the next month to fill the last row
    const daysNeeded = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= daysNeeded; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        otherMonth: true,
        today: this.isToday(date),
        selected: this.isSelected(date)
      });
    }
    
    this.calendarDays = days;
  }
  
  /**
   * Check if the given date is today
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  /**
   * Check if the given date is selected
   */
  isSelected(date: Date): boolean {
    // Check if date matches start or end date
    const start = this.customDateRange.start;
    const end = this.customDateRange.end;
    
    return (date.getDate() === start.getDate() &&
            date.getMonth() === start.getMonth() &&
            date.getFullYear() === start.getFullYear()) ||
           (date.getDate() === end.getDate() &&
            date.getMonth() === end.getMonth() &&
            date.getFullYear() === end.getFullYear());
  }
  
  /**
   * Handle date selection in the calendar
   */
  selectDate(day: { date: Date }): void {
    if (this.selectionMode === 'start') {
      this.customDateRange.start = new Date(day.date);
      // If start date is after current end date, reset end date too
      if (this.customDateRange.start > this.customDateRange.end) {
        this.customDateRange.end = new Date(day.date);
      }
      this.selectionMode = 'end';
    } else {
      if (day.date < this.customDateRange.start) {
        // If selected date is before start date, swap them
        this.customDateRange.end = new Date(this.customDateRange.start);
        this.customDateRange.start = new Date(day.date);
      } else {
        this.customDateRange.end = new Date(day.date);
      }
      this.selectionMode = 'start';
    }
    this.generateCalendarDays(); // Refresh to show selection
  }
  
  /**
   * Set a quick period from the calendar dropdown
   */
  setQuickPeriod(period: string): void {
    this.statsFilterPeriod = period;
    
    const today = new Date();
    let startDate: Date;
    
    switch(period) {
      case 'lastWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'lastMonth':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
    }
    
    this.customDateRange = {
      start: startDate,
      end: today
    };
    
    this.applyCustomDateRange();
  }
  
  /**
   * Handle date filter changes from dropdown
   */
  onDateFilterChange(): void {
    if (this.statsFilterPeriod === 'custom') {
      this.toggleDatePicker();
    } else {
      this.setQuickPeriod(this.statsFilterPeriod);
    }
    this.loadDashboardData();
  }
}