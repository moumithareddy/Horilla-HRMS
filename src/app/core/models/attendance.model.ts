export interface Attendance {
  id: number;
  employee_id: number;
  employee_name?: string;
  employee_position?: string;
  attendance_date: string;
  attendance_clock_in_time?: string;
  attendance_clock_out_time?: string;
  attendance_clock_in_location?: string;
  attendance_clock_out_location?: string;
  attendance_worked_hour?: number;
  attendance_status: string;
  attendance_overtime_hour?: number;
  attendance_approved?: boolean;
  shift_id?: number;
  shift_name?: string;
  attendance_type?: string;
  is_active: boolean;
  created_at?: string;
  created_by_id?: number;
  modified_by_id?: number;
  department_name?: string;
  company_name?: string;
}

export interface AttendanceStatus {
  id: string;
  name: string;
  color: string;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
  overtime: number;
  workHours: number;
  // For department summary
  department?: {
    id: number;
    department_name: string;
  };
  employeeCount?: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  halfDayCount?: number;
  onLeaveCount?: number;
  workingHoursAvg?: number;
  attendancePercentage?: number;
  // For employee summary
  employee?: {
    id: number;
    employee_first_name: string;
    employee_last_name: string;
    department_name: string;
    designation: string;
  };
  totalWorkHours?: number;
  totalOvertimeHours?: number;
  // Common properties
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AttendanceFilter {
  employeeId?: number;
  departmentId?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  shiftId?: number;
  locationType?: string; // 'Home' or 'Office'
}

export interface AttendanceReport {
  id: number;
  name: string;
  dateGenerated: string;
  dateRange: {
    start: string;
    end: string;
  };
  generatedBy: string;
  type: string;
  format: string;
  url?: string;
}
