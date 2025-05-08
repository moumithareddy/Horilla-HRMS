import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AttendanceService } from '../../../core/services/attendance.service';
import * as XLSX from 'xlsx';
import { Attendance } from '../../../core/models/attendance.model';

@Component({
  selector: 'app-attendance-bulk-upload',
  templateUrl: './attendance-bulk-upload.component.html',
  styleUrls: ['./attendance-bulk-upload.component.scss'],
  standalone: false
})
export class AttendanceBulkUploadComponent implements OnInit {
  uploadForm: FormGroup;
  isLoading = false;
  fileName = '';
  importData: Attendance[] = [];
  sampleData: any[] = []; // For sample file download
  previewData: any[] = [];
  previewColumns: string[] = [
    'employee_name',
    'department_name',
    'attendance_date',
    'attendance_clock_in_time',
    'attendance_clock_out_time',
    'attendance_worked_hour',
    'attendance_status'
  ];
  displayedColumns: string[] = [
    'employee_id',
    'employee_name',
    'department_name',
    'attendance_date',
    'attendance_clock_in_time',
    'attendance_clock_out_time',
    'attendance_worked_hour',
    'attendance_status'
  ];
  isPreviewMode = false;
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AttendanceBulkUploadComponent>,
    private attendanceService: AttendanceService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.uploadForm = this.fb.group({
      file: [''],
      skipHeader: [true]
    });
    
    // Create sample data for template download
    this.generateSampleData();
  }

  ngOnInit(): void {
  }
  
  generateSampleData(): void {
    this.sampleData = [
      {
        'Employee ID': 1,
        'Employee Name': 'John Doe',
        'Department': 'HR',
        'Date (YYYY-MM-DD)': '2025-05-01',
        'Clock In Time (HH:MM)': '09:00',
        'Clock Out Time (HH:MM)': '17:00',
        'Work Hours': 8,
        'Status': 'Present'
      },
      {
        'Employee ID': 2,
        'Employee Name': 'Jane Smith',
        'Department': 'Engineering',
        'Date (YYYY-MM-DD)': '2025-05-01',
        'Clock In Time (HH:MM)': '09:15',
        'Clock Out Time (HH:MM)': '17:30',
        'Work Hours': 8.25,
        'Status': 'Present'
      }
    ];
  }
  
  downloadSampleExcel(): void {
    // Convert sample data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(this.sampleData);
    
    // Create workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Data');
    
    // Generate Excel file
    XLSX.writeFile(workbook, 'attendance_upload_template.xlsx');
  }
  
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.isLoading = true;
      
      const fileReader = new FileReader();
      fileReader.onload = (e: any) => {
        try {
          // Parse Excel file
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          
          // Get first sheet
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Convert to JSON
          const excelData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          
          // Map the Excel data to the required format
          this.mapExcelDataToAttendanceRecords(excelData);
          
          // Process records directly without preview
          this.uploadAttendanceRecords();
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          this.snackBar.open('Error parsing Excel file. Please check the format.', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      };
      
      fileReader.onerror = (error) => {
        console.error('File reading error:', error);
        this.snackBar.open('Error reading file.', 'Close', { duration: 3000 });
        this.isLoading = false;
      };
      
      fileReader.readAsBinaryString(file);
    }
  }
  
  // Map Excel data to attendance records
  mapExcelDataToAttendanceRecords(excelData: any[]): void {
    this.importData = excelData.map(row => {
      const employeeId = parseInt(row['Employee ID'] || '0', 10);
      
      const record: Attendance = {
        id: 0, // Will be assigned by the server
        employee_id: employeeId,
        employee_name: row['Employee Name'] || '',
        department_name: row['Department'] || '',
        attendance_date: row['Date (YYYY-MM-DD)'] || this.getCurrentDate(),
        attendance_clock_in_time: row['Clock In Time (HH:MM)'] || '',
        attendance_clock_out_time: row['Clock Out Time (HH:MM)'] || '',
        attendance_worked_hour: parseFloat(row['Work Hours'] || '0'),
        attendance_status: row['Status'] || 'PRESENT',
        is_active: true
      };
      
      return record;
    });
    
    // Create preview data
    this.createPreviewData();
  }
  
  // Create preview data from the imported records
  createPreviewData(): void {
    this.previewData = this.importData.map(record => {
      return {
        employee_id: record.employee_id,
        employee_name: record.employee_name,
        department_name: record.department_name,
        attendance_date: record.attendance_date,
        attendance_clock_in_time: record.attendance_clock_in_time,
        attendance_clock_out_time: record.attendance_clock_out_time,
        attendance_worked_hour: record.attendance_worked_hour,
        attendance_status: record.attendance_status
      };
    });
  }
  
  // Upload the imported attendance records
  uploadAttendanceRecords(): void {
    if (this.importData.length === 0) {
      this.snackBar.open('No valid data to import.', 'Close', { duration: 3000 });
      return;
    }
    
    this.isLoading = true;
    
    this.attendanceService.addBulkAttendance(this.importData).subscribe(
      (response: any) => {
        this.isLoading = false;
        
        // Check if the response has our new format with inserted and duplicates
        if (response && response.summary) {
          const { inserted, duplicates, summary } = response;
          
          // Construct a meaningful success message that includes duplicates info
          const successMessage = `Successfully imported ${summary.inserted} records. ${summary.duplicates} duplicate records were skipped.`;
          
          this.snackBar.open(successMessage, 'Close', { duration: 5000 });
          
          this.dialogRef.close({ 
            success: true, 
            inserted: summary.inserted,
            duplicates: summary.duplicates,
            total: summary.total
          });
        } else {
          // Old response format, compatibility mode
          this.dialogRef.close({ 
            success: true, 
            count: Array.isArray(response) ? response.length : this.importData.length
          });
        }
      },
      (error) => {
        console.error('Error uploading attendance records:', error);
        this.snackBar.open('Error uploading attendance records.', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    );
  }
  
  // Cancel and close the dialog
  cancel(): void {
    this.dialogRef.close();
  }
  
  // Back to upload form from preview
  backToUpload(): void {
    this.isPreviewMode = false;
    this.importData = [];
    this.previewData = [];
    this.fileName = '';
    this.uploadForm.get('file')?.setValue('');
  }
  
  // Helper method to get current date in YYYY-MM-DD format
  private getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}