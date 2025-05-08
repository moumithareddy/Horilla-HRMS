import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AttendanceService } from '../../../core/services/attendance.service';
import { DepartmentService } from '../../../core/services/department.service';
import { Employee } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';

@Component({
  selector: 'app-attendance-dialog',
  templateUrl: './attendance-dialog.component.html',
  styleUrls: ['./attendance-dialog.component.scss'],
  standalone: false
})
export class AttendanceDialogComponent implements OnInit {
  attendanceForm: FormGroup;
  employees: Employee[] = [];
  departments: Department[] = [];
  isLoading = false;
  statuses = [
    { id: 'Present', name: 'Present' },
    { id: 'Absent', name: 'Absent' },
    { id: 'Half Day', name: 'Half Day' },
    { id: 'Late', name: 'Late' },
    { id: 'Early Departure', name: 'Early Departure' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AttendanceDialogComponent>,
    private attendanceService: AttendanceService,
    private departmentService: DepartmentService,
    @Inject(MAT_DIALOG_DATA) public data: { date?: string }
  ) {
    this.attendanceForm = this.fb.group({
      sharedAttendance: this.fb.group({
        employee_ids: [[], [Validators.required, Validators.minLength(1)]],
        department_id: [''],
        attendance_date: [data?.date || this.getCurrentDate(), Validators.required],
        attendance_clock_in_time: [''],
        attendance_clock_out_time: [''],
        attendance_status: ['Present', Validators.required],
        attendance_worked_hour: ['0'],
        attendance_overtime_hour: ['0'],
        attendance_notes: ['']
      })
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
  }
  
  loadDepartments(): void {
    this.departmentService.getActiveDepartments().subscribe(
      departments => {
        this.departments = departments;
      },
      error => {
        console.error('Error loading departments', error);
      }
    );
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.attendanceService.getEmployees().subscribe(
      employees => {
        this.employees = employees;
        this.isLoading = false;
      },
      error => {
        console.error('Error loading employees', error);
        this.isLoading = false;
      }
    );
  }

  calculateWorkHours(): void {
    const sharedForm = this.attendanceForm.get('sharedAttendance') as FormGroup;
    const clockIn = sharedForm.get('attendance_clock_in_time')?.value;
    const clockOut = sharedForm.get('attendance_clock_out_time')?.value;
    
    if (clockIn && clockOut) {
      try {
        const [inHours, inMinutes] = clockIn.split(':').map(Number);
        const [outHours, outMinutes] = clockOut.split(':').map(Number);
        
        const today = new Date();
        const inDate = new Date(today);
        inDate.setHours(inHours, inMinutes, 0);
        
        const outDate = new Date(today);
        outDate.setHours(outHours, outMinutes, 0);
        
        let diffMs = outDate.getTime() - inDate.getTime();
        // Handle clock out on next day
        if (diffMs < 0) {
          outDate.setDate(outDate.getDate() + 1);
          diffMs = outDate.getTime() - inDate.getTime();
        }
        
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours > 0) {
          // Set work hours
          sharedForm.patchValue({
            attendance_worked_hour: diffHours.toFixed(2)
          });
          
          // Calculate overtime (assuming 8 hours is standard)
          const overtime = Math.max(0, diffHours - 8);
          if (overtime > 0) {
            sharedForm.patchValue({
              attendance_overtime_hour: overtime.toFixed(2)
            });
          } else {
            sharedForm.patchValue({
              attendance_overtime_hour: '0'
            });
          }
        }
      } catch (e) {
        console.error('Error calculating work hours', e);
      }
    }
  }

  submitAttendance(): void {
    this.isLoading = true;
    
    const sharedData = this.attendanceForm.get('sharedAttendance')?.value;
    const selectedEmployeeIds = sharedData.employee_ids;
    
    // Create individual attendance records for each selected employee
    const attendanceRecords = selectedEmployeeIds.map((employeeId: string | number) => {
      return {
        employee_id: employeeId,
        department_id: sharedData.department_id || null,
        attendance_date: sharedData.attendance_date,
        attendance_clock_in_time: sharedData.attendance_clock_in_time,
        attendance_clock_out_time: sharedData.attendance_clock_out_time,
        attendance_status: sharedData.attendance_status,
        attendance_worked_hour: sharedData.attendance_worked_hour,
        attendance_overtime_hour: sharedData.attendance_overtime_hour,
        attendance_notes: sharedData.attendance_notes
      };
    });
    
    // Submit multiple records but each as individual attendance
    this.attendanceService.addBulkAttendance(attendanceRecords).subscribe(
      () => {
        this.isLoading = false;
        // Pass back the number of records added for the success message
        this.dialogRef.close({ 
          success: true, 
          count: selectedEmployeeIds.length 
        });
      },
      error => {
        console.error('Error saving attendance records', error);
        this.isLoading = false;
      }
    );
  }

  cancel(): void {
    this.dialogRef.close();
  }

  // Helper method
  private getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}