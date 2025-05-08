export interface Employee {
  id: number;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  department_id?: number;
  department_name?: string;
  designation?: string;
  join_date?: string;
  status?: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
}

export interface EmployeeFilter {
  departmentId?: number;
  designationId?: number;
  status?: string;
  query?: string;
}