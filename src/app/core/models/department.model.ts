export interface Department {
  id: number;
  department_name: string;
  department_code?: string;
  department_description?: string;
  department_parent_id?: number;
  department_company_id?: number;
  company_name?: string;
  is_active: boolean;
  created_at?: string;
}

export interface DepartmentAttendanceSummary {
  department: Department;
  employeeCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  attendancePercentage: number;
  averageWorkHours: number;
  averageOvertime: number;
}
