import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Attendance, 
  AttendanceFilter, 
  AttendanceReport, 
  AttendanceStatus,
  AttendanceSummary 
} from '../models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;
  private useMockData = environment.useMockData; // Use environment setting
  
  // Store mock attendance records (for in-memory persistence)
  private mockAttendanceRecords: Attendance[] = [
    // HR Department
    {
      id: 1,
      employee_id: 1,
      employee_name: 'John Doe',
      employee_position: 'HR Manager',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:00',
      attendance_clock_out_time: '17:00',
      attendance_worked_hour: 8,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 2,
      employee_id: 2,
      employee_name: 'Sarah Johnson',
      employee_position: 'HR Specialist',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:45',
      attendance_clock_out_time: '17:15',
      attendance_worked_hour: 8.5,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.25,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 3,
      employee_id: 3,
      employee_name: 'Michael Brown',
      employee_position: 'Recruiter',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:10',
      attendance_clock_out_time: '17:00',
      attendance_worked_hour: 7.83,
      attendance_status: 'LATE',
      attendance_overtime_hour: 0,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 4,
      employee_id: 4,
      employee_name: 'Emma Wilson',
      employee_position: 'HR Assistant',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:02',
      attendance_clock_out_time: '17:05',
      attendance_worked_hour: 8.05,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 5,
      employee_id: 5,
      employee_name: 'Robert Taylor',
      employee_position: 'HR Coordinator',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:55',
      attendance_clock_out_time: '17:10',
      attendance_worked_hour: 8.25,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 6,
      employee_id: 6,
      employee_name: 'Lisa Martinez',
      employee_position: 'Payroll Specialist',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:00',
      attendance_clock_out_time: '17:30',
      attendance_worked_hour: 8.5,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.5,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 7,
      employee_id: 7,
      employee_name: 'Daniel Adams',
      employee_position: 'Compensation Analyst',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:05',
      attendance_clock_out_time: '17:00',
      attendance_worked_hour: 7.92,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 8,
      employee_id: 8,
      employee_name: 'Jennifer White',
      employee_position: 'Training Coordinator',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:00',
      attendance_clock_out_time: '17:15',
      attendance_worked_hour: 8.25,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.25,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 9,
      employee_id: 9,
      employee_name: 'Kevin Harris',
      employee_position: 'Benefits Administrator',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:50',
      attendance_clock_out_time: '17:10',
      attendance_worked_hour: 8.33,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.33,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 10,
      employee_id: 10,
      employee_name: 'Michelle Jackson',
      employee_position: 'HR Business Partner',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:15',
      attendance_clock_out_time: '17:15',
      attendance_worked_hour: 8,
      attendance_status: 'LATE',
      attendance_overtime_hour: 0,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 11,
      employee_id: 11,
      employee_name: 'Thomas Moore',
      employee_position: 'HR Analytics Specialist',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:00',
      attendance_clock_out_time: '17:30',
      attendance_worked_hour: 8.5,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.5,
      department_name: 'HR',
      is_active: true
    },
    {
      id: 12,
      employee_id: 12,
      employee_name: 'Angela Thompson',
      employee_position: 'Employee Relations Specialist',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:00',
      attendance_clock_out_time: '17:00',
      attendance_worked_hour: 8,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0,
      department_name: 'HR',
      is_active: true
    },
    
    // Engineering Department
    {
      id: 4,
      employee_id: 4,
      employee_name: 'Emily Chen',
      employee_position: 'Lead Developer',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:30',
      attendance_clock_out_time: '17:30',
      attendance_worked_hour: 9,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 1,
      department_name: 'Engineering',
      is_active: true
    },
    {
      id: 5,
      employee_id: 5,
      employee_name: 'David Wilson',
      employee_position: 'Backend Developer',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:00',
      attendance_clock_out_time: '18:00',
      attendance_worked_hour: 9,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 1,
      department_name: 'Engineering',
      is_active: true
    },
    {
      id: 6,
      employee_id: 6,
      employee_name: 'Sophia Martinez',
      employee_position: 'Frontend Developer',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:55',
      attendance_clock_out_time: '17:15',
      attendance_worked_hour: 8.33,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.25,
      department_name: 'Engineering',
      is_active: true
    },
    {
      id: 7,
      employee_id: 7,
      employee_name: 'James Taylor',
      employee_position: 'DevOps Engineer',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:45',
      attendance_clock_out_time: '17:30',
      attendance_worked_hour: 8.75,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.5,
      department_name: 'Engineering',
      is_active: true
    },
    
    // Finance Department
    {
      id: 8,
      employee_id: 8,
      employee_name: 'Robert Garcia',
      employee_position: 'Finance Director',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:30',
      attendance_clock_out_time: '17:00',
      attendance_worked_hour: 8.5,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0,
      department_name: 'Finance',
      is_active: true
    },
    {
      id: 9,
      employee_id: 9,
      employee_name: 'Amanda Lee',
      employee_position: 'Financial Analyst',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:00',
      attendance_clock_out_time: '17:30',
      attendance_worked_hour: 8.5,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.5,
      department_name: 'Finance',
      is_active: true
    },
    
    // Marketing Department
    {
      id: 10,
      employee_id: 10,
      employee_name: 'Jessica White',
      employee_position: 'Marketing Manager',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:05',
      attendance_clock_out_time: '17:10',
      attendance_worked_hour: 8.08,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0,
      department_name: 'Marketing',
      is_active: true
    },
    {
      id: 11,
      employee_id: 11,
      employee_name: 'Daniel Harris',
      employee_position: 'Content Strategist',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:15',
      attendance_clock_out_time: '17:00',
      attendance_worked_hour: 7.75,
      attendance_status: 'LATE',
      attendance_overtime_hour: 0,
      department_name: 'Marketing',
      is_active: true
    },
    {
      id: 12,
      employee_id: 12,
      employee_name: 'Lisa Thompson',
      employee_position: 'Social Media Specialist',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:50',
      attendance_clock_out_time: '17:00',
      attendance_worked_hour: 8.17,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0,
      department_name: 'Marketing',
      is_active: true
    },
    
    // Sales Department
    {
      id: 13,
      employee_id: 13,
      employee_name: 'Kevin Clark',
      employee_position: 'Sales Director',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '08:30',
      attendance_clock_out_time: '17:45',
      attendance_worked_hour: 9.25,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.75,
      department_name: 'Sales',
      is_active: true
    },
    {
      id: 14,
      employee_id: 14,
      employee_name: 'Michelle Scott',
      employee_position: 'Account Manager',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:00',
      attendance_clock_out_time: '17:15',
      attendance_worked_hour: 8.25,
      attendance_status: 'PRESENT',
      attendance_overtime_hour: 0.25,
      department_name: 'Sales',
      is_active: true
    },
    {
      id: 15,
      employee_id: 15,
      employee_name: 'Thomas Anderson',
      employee_position: 'Sales Representative',
      attendance_date: '2025-05-06', // Today
      attendance_clock_in_time: '09:10',
      attendance_clock_out_time: '17:00',
      attendance_worked_hour: 7.83,
      attendance_status: 'LATE',
      attendance_overtime_hour: 0,
      department_name: 'Sales',
      is_active: true
    }
  ];

  constructor(private http: HttpClient) { }

  // Get attendance records with optional filters
  getAttendanceRecords(filter?: AttendanceFilter): Observable<Attendance[]> {
    // First try the test endpoint without filters to get data
    console.log('Using direct test endpoint to retrieve records');
    return this.http.get<Attendance[]>(`${this.apiUrl}/test`)
      .pipe(
        catchError(error => {
          console.error('getAttendanceRecords test endpoint failed:', error);
          
          // If test endpoint fails, fall back to regular endpoint with filters
          console.log('Falling back to regular endpoint with filters');
          if (this.useMockData) {
            // Apply filters to the stored mock attendance records
            let filteredData = [...this.mockAttendanceRecords];
            
            if (filter) {
              if (filter.employeeId) {
                filteredData = filteredData.filter(record => record.employee_id === filter.employeeId);
              }
              if (filter.departmentId) {
                // Match department name based on department ID
                const departmentId = Number(filter.departmentId);
                const departmentName = this.getDepartmentNameFromId(departmentId);
                filteredData = filteredData.filter(record => record.department_name === departmentName);
              }
              if (filter.status) {
                filteredData = filteredData.filter(record => record.attendance_status === filter.status);
              }
              // Filter by location type (Home/Office)
              if (filter.locationType) {
                filteredData = filteredData.filter(record => 
                  record.attendance_clock_in_location === filter.locationType || 
                  record.attendance_clock_out_location === filter.locationType
                );
              }
              
              // Filter by date range if provided
              if (filter.dateRange && filter.dateRange.start && filter.dateRange.end) {
                const startDate = new Date(filter.dateRange.start);
                const endDate = new Date(filter.dateRange.end);
                
                filteredData = filteredData.filter(record => {
                  const recordDate = new Date(record.attendance_date);
                  return recordDate >= startDate && recordDate <= endDate;
                });
              }
            }
            
            // Sort by date in descending order (newest first)
            filteredData.sort((a, b) => {
              const dateA = new Date(a.attendance_date);
              const dateB = new Date(b.attendance_date);
              return dateB.getTime() - dateA.getTime();
            });
            
            return of(filteredData).pipe(delay(800));
          }
          
          let params = new HttpParams();
          
          if (filter) {
            if (filter.employeeId) {
              params = params.append('employeeId', filter.employeeId.toString());
            }
            if (filter.departmentId) {
              params = params.append('departmentId', filter.departmentId.toString());
            }
            if (filter.status) {
              params = params.append('status', filter.status);
            }
            if (filter.shiftId) {
              params = params.append('shiftId', filter.shiftId.toString());
            }
            if (filter.dateRange) {
              params = params.append('startDate', filter.dateRange.start);
              params = params.append('endDate', filter.dateRange.end);
            }
            if (filter.locationType) {
              params = params.append('locationType', filter.locationType);
            }
          }

          return this.http.get<Attendance[]>(`${this.apiUrl}/records`, { params })
            .pipe(
              catchError(this.handleError<Attendance[]>('getAttendanceRecords', []))
            );
        })
      );
  }
  
  // Alias for getAttendanceRecords to maintain compatibility
  getAttendances(filter?: AttendanceFilter): Observable<Attendance[]> {
    return this.getAttendanceRecords(filter);
  }

  // Get single attendance record
  getAttendanceById(id: number): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.apiUrl}/records/${id}`)
      .pipe(
        catchError(this.handleError<Attendance>('getAttendanceById'))
      );
  }

  // Create attendance record
  createAttendance(attendance: Attendance): Observable<Attendance> {
    if (this.useMockData) {
      // Check for duplicates
      const isDuplicate = this.mockAttendanceRecords.some(record => 
        record.employee_id === attendance.employee_id && 
        record.attendance_date === attendance.attendance_date &&
        record.attendance_clock_in_time === attendance.attendance_clock_in_time
      );
      
      if (isDuplicate) {
        return of(attendance as Attendance).pipe(delay(800));
      }
      
      // Generate new ID for the attendance record
      const newId = Math.max(...this.mockAttendanceRecords.map(a => a.id), 0) + 1;
      
      // Create a complete attendance record with ID
      const newAttendance: Attendance = {
        ...attendance,
        id: newId,
        employee_name: attendance.employee_name || this.getEmployeeName(attendance.employee_id),
        department_name: attendance.department_name || this.getDepartmentName(attendance.employee_id),
        is_active: true
      };
      
      // Add to stored records at the beginning (newest first)
      this.mockAttendanceRecords.unshift(newAttendance);
      
      return of(newAttendance).pipe(delay(800));
    }
    
    return this.http.post<Attendance>(`${this.apiUrl}/records`, attendance)
      .pipe(
        catchError((error) => {
          // Check for duplicate record error (HTTP 409 Conflict)
          if (error.status === 409) {
            console.warn('Duplicate attendance record:', error.error?.message);
            // Return a special error object that components can check
            return of({
              isDuplicate: true,
              existingRecordId: error.error?.existingRecordId,
              message: error.error?.message || 'Duplicate attendance record',
              ...attendance // Include the original record data
            } as any);
          }
          // For other errors, use the default error handler
          return this.handleError<Attendance>('createAttendance')(error);
        })
      );
  }
  
  // Helper method to get employee name from ID
  private getEmployeeName(employeeId: number): string {
    switch(employeeId) {
      case 1: return 'John Doe';
      case 2: return 'Jane Smith';
      case 3: return 'Michael Johnson';
      case 4: return 'Sarah Williams';
      case 5: return 'David Brown';
      default: return `Employee ${employeeId}`;
    }
  }
  
  // Helper method to get department name from employee ID
  private getDepartmentName(employeeId: number): string {
    switch(employeeId) {
      case 1: return 'HR';
      case 2: 
      case 4: return 'Engineering';
      case 3: return 'Finance';
      case 5: return 'Marketing';
      default: return 'General';
    }
  }

  // Update attendance record
  updateAttendance(id: number, attendance: Attendance): Observable<Attendance> {
    return this.http.put<Attendance>(`${this.apiUrl}/records/${id}`, attendance)
      .pipe(
        catchError(this.handleError<Attendance>('updateAttendance'))
      );
  }

  // Delete attendance record
  deleteAttendance(id: number): Observable<any> {
    if (this.useMockData) {
      // Find the index of the attendance with the given ID
      const index = this.mockAttendanceRecords.findIndex(record => record.id === id);
      
      if (index !== -1) {
        // Remove the record from the array
        this.mockAttendanceRecords.splice(index, 1);
      }
      
      return of({ success: true }).pipe(delay(800));
    }
    
    return this.http.delete(`${this.apiUrl}/records/${id}`)
      .pipe(
        catchError(this.handleError<any>('deleteAttendance'))
      );
  }

  // Get attendance status options
  getAttendanceStatuses(): Observable<AttendanceStatus[]> {
    if (this.useMockData) {
      const mockStatuses: AttendanceStatus[] = [
        { id: 'PRESENT', name: 'Present', color: '#4CAF50' },
        { id: 'ABSENT', name: 'Absent', color: '#F44336' },
        { id: 'LATE', name: 'Late', color: '#FFC107' },
        { id: 'HALF_DAY', name: 'Half Day', color: '#2196F3' },
        { id: 'ON_LEAVE', name: 'On Leave', color: '#9C27B0' }
      ];
      
      return of(mockStatuses).pipe(delay(300));
    }
    
    return this.http.get<AttendanceStatus[]>(`${this.apiUrl}/statuses`)
      .pipe(
        catchError(this.handleError<AttendanceStatus[]>('getAttendanceStatuses', []))
      );
  }

  // Get employee attendance summary
  getEmployeeAttendanceSummary(employeeId: number, startDate: string, endDate: string): Observable<AttendanceSummary> {
    if (this.useMockData) {
      // Create mock employee attendance summary data
      const mockSummary: any = {
        employee: { 
          id: employeeId, 
          employee_first_name: employeeId === 1 ? 'John' : 'Jane',
          employee_last_name: employeeId === 1 ? 'Doe' : 'Smith',
          department_name: employeeId === 1 ? 'HR' : 'Engineering',
          designation: employeeId === 1 ? 'Manager' : 'Developer'
        },
        attendancePercentage: 85,
        present: 17,
        absent: 1,
        late: 1,
        halfDay: 0,
        onLeave: 1,
        totalWorkHours: 136,
        totalOvertimeHours: 5,
        dateRange: {
          start: startDate,
          end: endDate
        }
      };
      
      return of(mockSummary).pipe(delay(800));
    }
    
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<AttendanceSummary>(`${this.apiUrl}/summary/employee/${employeeId}`, { params })
      .pipe(
        catchError(this.handleError<AttendanceSummary>('getEmployeeAttendanceSummary'))
      );
  }

  // Get department attendance summary
  getDepartmentAttendanceSummary(departmentId: number, startDate: string, endDate: string): Observable<AttendanceSummary> {
    if (this.useMockData) {
      // Create mock department attendance summary data
      const mockSummary: any = {
        department: departmentId ? { 
          id: departmentId, 
          department_name: departmentId === 1 ? 'HR' : 'Engineering' 
        } : null,
        employeeCount: 25,
        presentCount: 20,
        absentCount: 2,
        lateCount: 1,
        halfDayCount: 1,
        onLeaveCount: 1,
        workingHoursAvg: 7.5,
        attendancePercentage: 80,
        dateRange: {
          start: startDate,
          end: endDate
        }
      };
      
      return of(mockSummary).pipe(delay(800));
    }
    
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<AttendanceSummary>(`${this.apiUrl}/summary/department/${departmentId}`, { params })
      .pipe(
        catchError(this.handleError<AttendanceSummary>('getDepartmentAttendanceSummary'))
      );
  }

  // Get attendance reports
  getAttendanceReports(): Observable<AttendanceReport[]> {
    if (this.useMockData) {
      const mockReports: AttendanceReport[] = [
        {
          id: 1,
          name: 'Monthly Attendance Report',
          type: 'MONTHLY',
          format: 'PDF',
          dateGenerated: '2025-04-01',
          dateRange: {
            start: '2025-03-01',
            end: '2025-03-31'
          },
          generatedBy: 'System Admin',
          url: '#'
        },
        {
          id: 2,
          name: 'Engineering Department Report',
          type: 'DEPARTMENT',
          format: 'EXCEL',
          dateGenerated: '2025-04-15',
          dateRange: {
            start: '2025-04-01',
            end: '2025-04-15'
          },
          generatedBy: 'HR Manager',
          url: '#'
        }
      ];
      
      return of(mockReports).pipe(delay(800));
    }
    
    return this.http.get<AttendanceReport[]>(`${this.apiUrl}/reports`)
      .pipe(
        catchError(this.handleError<AttendanceReport[]>('getAttendanceReports', []))
      );
  }

  // Generate attendance report
  generateAttendanceReport(report: Partial<AttendanceReport>): Observable<AttendanceReport> {
    if (this.useMockData) {
      // Create a new report with the provided data and some defaults
      const newReport: AttendanceReport = {
        id: Math.floor(Math.random() * 1000) + 3, // Generate a random ID
        name: report.name || 'Generated Report',
        type: report.type || 'DAILY',
        format: report.format || 'PDF',
        dateGenerated: new Date().toISOString().split('T')[0],
        dateRange: report.dateRange || {
          start: '',
          end: ''
        },
        generatedBy: 'Current User',
        url: '#'
      };
      
      return of(newReport).pipe(delay(1000));
    }
    
    return this.http.post<AttendanceReport>(`${this.apiUrl}/reports/generate`, report)
      .pipe(
        catchError(this.handleError<AttendanceReport>('generateAttendanceReport'))
      );
  }

  // Clock in attendance
  clockIn(employeeId: number, location?: string): Observable<Attendance> {
    if (this.useMockData) {
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0].substr(0, 5);
      const dateString = now.toISOString().split('T')[0];
      
      const mockAttendance: Attendance = {
        id: Math.floor(Math.random() * 1000) + 100,
        employee_id: employeeId,
        employee_name: employeeId === 1 ? 'John Doe' : 'Jane Smith',
        attendance_date: dateString,
        attendance_clock_in_time: timeString,
        attendance_clock_in_location: location || 'Office',
        attendance_status: 'PRESENT',
        is_active: true,
        department_name: employeeId === 1 ? 'HR' : 'Engineering'
      };
      
      return of(mockAttendance).pipe(delay(800));
    }
    
    const payload = {
      employeeId,
      location
    };

    return this.http.post<Attendance>(`${this.apiUrl}/clock-in`, payload)
      .pipe(
        catchError(this.handleError<Attendance>('clockIn'))
      );
  }

  // Clock out attendance
  clockOut(employeeId: number, location?: string): Observable<Attendance> {
    if (this.useMockData) {
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0].substr(0, 5);
      const dateString = now.toISOString().split('T')[0];
      const clockInTime = '09:00'; // Assuming clock in was at 9:00
      
      // Calculate work hours (current time - clock in time)
      const inHours = parseInt(clockInTime.split(':')[0]);
      const inMinutes = parseInt(clockInTime.split(':')[1]);
      const outHours = now.getHours();
      const outMinutes = now.getMinutes();
      const workedHours = outHours - inHours + (outMinutes - inMinutes) / 60;
      
      const mockAttendance: Attendance = {
        id: Math.floor(Math.random() * 1000) + 100,
        employee_id: employeeId,
        employee_name: employeeId === 1 ? 'John Doe' : 'Jane Smith',
        attendance_date: dateString,
        attendance_clock_in_time: clockInTime,
        attendance_clock_out_time: timeString,
        attendance_clock_in_location: 'Office',
        attendance_clock_out_location: location || 'Office',
        attendance_worked_hour: workedHours,
        attendance_status: 'PRESENT',
        is_active: true,
        department_name: employeeId === 1 ? 'HR' : 'Engineering'
      };
      
      return of(mockAttendance).pipe(delay(800));
    }
    
    const payload = {
      employeeId,
      location
    };

    return this.http.post<Attendance>(`${this.apiUrl}/clock-out`, payload)
      .pipe(
        catchError(this.handleError<Attendance>('clockOut'))
      );
  }
  
  // Check if user is clocked in
  isUserClockedIn(employeeId: number = 1): boolean {
    if (this.useMockData) {
      const today = new Date().toISOString().split('T')[0];
      
      // Find today's attendance record for this employee
      const todayRecord = this.mockAttendanceRecords.find(record => 
        record.employee_id === employeeId && 
        record.attendance_date === today
      );
      
      // If there's a record with clock-in time but no clock-out time, user is clocked in
      return !!todayRecord && 
             !!todayRecord.attendance_clock_in_time && 
             !todayRecord.attendance_clock_out_time;
    }
    
    // In a real implementation, this would call the API
    return false;
  }

  // Get attendance records for a specific department
  getDepartmentAttendanceRecords(departmentId: number, startDate: string, endDate: string): Observable<Attendance[]> {
    if (this.useMockData) {
      // Filter records based on department and date range
      let records = [...this.mockAttendanceRecords];
      
      // If departmentId is specified, filter by department
      if (departmentId) {
        const departmentName = this.getDepartmentNameFromId(departmentId);
        records = records.filter(record => record.department_name === departmentName);
      }
      
      // Filter by date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      records = records.filter(record => {
        const recordDate = new Date(record.attendance_date);
        return recordDate >= start && recordDate <= end;
      });
      
      // Only return present or late employees (those who are at work)
      records = records.filter(record => 
        record.attendance_status === 'PRESENT' || 
        record.attendance_status === 'LATE' || 
        (record.attendance_clock_in_time && !record.attendance_clock_out_time)
      );
      
      return of(records).pipe(delay(800));
    }
    
    // For real API implementation
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    if (departmentId) {
      params = params.append('departmentId', departmentId.toString());
    }
    
    return this.http.get<Attendance[]>(`${this.apiUrl}/department-attendance`, { params })
      .pipe(
        catchError(this.handleError<Attendance[]>('getDepartmentAttendanceRecords', []))
      );
  }
  
  // Helper to get department name from ID
  private getDepartmentNameFromId(departmentId: number): string {
    switch(departmentId) {
      case 1: return 'HR';
      case 2: return 'Engineering';
      case 3: return 'Finance';
      case 4: return 'Marketing';
      case 5: return 'Sales';
      case 6: return 'Human Resources';
      case 7: return 'IT';
      case 8: return 'Administration';
      case 9: return 'Customer Support';
      case 10: return 'Accounting';
      default: return '';
    }
  }

  // Record attendance (manual)
  recordAttendance(attendance: Partial<Attendance>): Observable<Attendance> {
    if (this.useMockData) {
      // Create a complete attendance record from the partial one
      const mockAttendance: Attendance = {
        id: Math.floor(Math.random() * 1000) + 100,
        employee_id: attendance.employee_id || 1,
        employee_name: attendance.employee_name || 'John Doe',
        attendance_date: attendance.attendance_date || new Date().toISOString().split('T')[0],
        attendance_clock_in_time: attendance.attendance_clock_in_time || '09:00',
        attendance_clock_out_time: attendance.attendance_clock_out_time || '17:00',
        attendance_worked_hour: attendance.attendance_worked_hour || 8,
        attendance_status: attendance.attendance_status || 'PRESENT',
        attendance_overtime_hour: attendance.attendance_overtime_hour || 0,
        is_active: true,
        department_name: attendance.department_name || 'HR'
      };
      
      return of(mockAttendance).pipe(delay(800));
    }
    
    return this.http.post<Attendance>(`${this.apiUrl}/record`, attendance)
      .pipe(
        catchError(this.handleError<Attendance>('recordAttendance'))
      );
  }

  // Create bulk attendance
  createBulkAttendance(attendances: Attendance[]): Observable<any> {
    if (this.useMockData) {
      // Get the next ID (max existing ID + 1)
      let nextId = Math.max(...this.mockAttendanceRecords.map(a => a.id), 0) + 1;
      const result: Attendance[] = [];
      
      // Process and store each attendance record
      attendances.forEach((attendance, index) => {
        // Check for duplicates before adding
        const isDuplicate = this.mockAttendanceRecords.some(record => 
          record.employee_id === attendance.employee_id && 
          record.attendance_date === attendance.attendance_date &&
          record.attendance_clock_in_time === attendance.attendance_clock_in_time
        );
        
        if (!isDuplicate) {
          // Create a complete attendance record
          const newAttendance: Attendance = {
            ...attendance,
            id: nextId + index,
            employee_name: attendance.employee_name || this.getEmployeeName(+attendance.employee_id), // Use provided name or get from service
            department_name: attendance.department_name || this.getDepartmentName(+attendance.employee_id),
            is_active: true
          };
          
          // Add to stored mock records (at the beginning for newest first)
          this.mockAttendanceRecords.unshift(newAttendance);
          result.push(newAttendance);
        }
      });
      
      return of(result).pipe(delay(1000));
    }
    
    return this.http.post<any>(`${this.apiUrl}/records/bulk`, attendances)
      .pipe(
        // Don't use the default error handler here as we get a structured response with duplicates
        catchError((error) => {
          console.error('Error in bulk attendance upload:', error);
          return of({ 
            inserted: [], 
            duplicates: [], 
            summary: { total: attendances.length, inserted: 0, duplicates: 0 }
          });
        })
      );
  }
  
  // Add a single attendance record (alias for createAttendance for dialog compatibility)
  addAttendance(attendance: any): Observable<Attendance> {
    return this.createAttendance(attendance);
  }
  
  // Add multiple attendance records (alias for createBulkAttendance for dialog compatibility)
  addBulkAttendance(attendances: any[]): Observable<any> {
    return this.createBulkAttendance(attendances);
  }
  
  // Get employees list for dropdown
  getEmployees(): Observable<any[]> {
    if (this.useMockData) {
      const mockEmployees = [
        { id: 1, first_name: 'John', last_name: 'Doe', department_id: 1, department_name: 'HR' },
        { id: 2, first_name: 'Jane', last_name: 'Smith', department_id: 2, department_name: 'Engineering' },
        { id: 3, first_name: 'Michael', last_name: 'Johnson', department_id: 3, department_name: 'Finance' },
        { id: 4, first_name: 'Sarah', last_name: 'Williams', department_id: 2, department_name: 'Engineering' },
        { id: 5, first_name: 'David', last_name: 'Brown', department_id: 4, department_name: 'Marketing' }
      ];
      
      return of(mockEmployees).pipe(delay(300));
    }
    
    return this.http.get<any[]>(`${environment.apiUrl}/employees`)
      .pipe(
        catchError(this.handleError<any[]>('getEmployees', []))
      );
  }

  // Get attendance overtime requests
  getAttendanceOvertimeRequests(): Observable<any[]> {
    if (this.useMockData) {
      const mockRequests = [
        {
          id: 1,
          employee_id: 1,
          employee_name: 'John Doe',
          department_name: 'HR',
          date: '2025-05-01',
          hours: 2.5,
          status: 'PENDING',
          reason: 'Finishing month-end reports'
        },
        {
          id: 2,
          employee_id: 2,
          employee_name: 'Jane Smith',
          department_name: 'Engineering',
          date: '2025-05-02',
          hours: 1.5,
          status: 'APPROVED',
          reason: 'Server migration task'
        }
      ];
      
      return of(mockRequests).pipe(delay(800));
    }
    
    return this.http.get<any[]>(`${this.apiUrl}/overtime-requests`)
      .pipe(
        catchError(this.handleError<any[]>('getAttendanceOvertimeRequests', []))
      );
  }

  // Get late/early records
  getLateEarlyRecords(filter?: AttendanceFilter): Observable<any[]> {
    if (this.useMockData) {
      const mockRecords = [
        {
          id: 1,
          employee_id: 1,
          employee_name: 'John Doe',
          department_name: 'HR',
          date: '2025-05-01',
          schedule_start: '09:00',
          actual_start: '09:15',
          late_minutes: 15,
          schedule_end: '17:00',
          actual_end: '17:00',
          early_minutes: 0,
          status: 'LATE'
        },
        {
          id: 2,
          employee_id: 2,
          employee_name: 'Jane Smith',
          department_name: 'Engineering',
          date: '2025-05-02',
          schedule_start: '09:00',
          actual_start: '09:00',
          late_minutes: 0,
          schedule_end: '17:00',
          actual_end: '16:45',
          early_minutes: 15,
          status: 'LEFT_EARLY'
        }
      ];
      
      // Apply any filters
      let filteredRecords = [...mockRecords];
      
      if (filter) {
        if (filter.employeeId) {
          filteredRecords = filteredRecords.filter(record => record.employee_id === filter.employeeId);
        }
      }
      
      return of(filteredRecords).pipe(delay(800));
    }
    
    let params = new HttpParams();
    
    if (filter) {
      if (filter.employeeId) {
        params = params.append('employeeId', filter.employeeId.toString());
      }
      if (filter.departmentId) {
        params = params.append('departmentId', filter.departmentId.toString());
      }
      if (filter.dateRange) {
        params = params.append('startDate', filter.dateRange.start);
        params = params.append('endDate', filter.dateRange.end);
      }
    }

    return this.http.get<any[]>(`${this.apiUrl}/late-early`, { params })
      .pipe(
        catchError(this.handleError<any[]>('getLateEarlyRecords', []))
      );
  }

  // Get work records
  getWorkRecords(filter?: AttendanceFilter): Observable<any[]> {
    if (this.useMockData) {
      const mockRecords = [
        {
          id: 1,
          employee_id: 1,
          employee_name: 'John Doe',
          department_name: 'HR',
          date: '2025-05-01',
          worked_hours: 8,
          overtime_hours: 0,
          break_hours: 1,
          total_hours: 9
        },
        {
          id: 2,
          employee_id: 1,
          employee_name: 'John Doe',
          department_name: 'HR',
          date: '2025-05-02',
          worked_hours: 8.5,
          overtime_hours: 0.5,
          break_hours: 1,
          total_hours: 10
        },
        {
          id: 3,
          employee_id: 2,
          employee_name: 'Jane Smith',
          department_name: 'Engineering',
          date: '2025-05-01',
          worked_hours: 8,
          overtime_hours: 0,
          break_hours: 1,
          total_hours: 9
        }
      ];
      
      // Apply any filters
      let filteredRecords = [...mockRecords];
      
      if (filter) {
        if (filter.employeeId) {
          filteredRecords = filteredRecords.filter(record => record.employee_id === filter.employeeId);
        }
      }
      
      return of(filteredRecords).pipe(delay(800));
    }
    
    let params = new HttpParams();
    
    if (filter) {
      if (filter.employeeId) {
        params = params.append('employeeId', filter.employeeId.toString());
      }
      if (filter.departmentId) {
        params = params.append('departmentId', filter.departmentId.toString());
      }
      if (filter.dateRange) {
        params = params.append('startDate', filter.dateRange.start);
        params = params.append('endDate', filter.dateRange.end);
      }
    }

    return this.http.get<any[]>(`${this.apiUrl}/work-records`, { params })
      .pipe(
        catchError(this.handleError<any[]>('getWorkRecords', []))
      );
  }

  // Error handling
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Return an empty result or the provided default
      return of(result as T);
    };
  }
}