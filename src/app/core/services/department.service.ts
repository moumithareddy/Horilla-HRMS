import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Department } from '../models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/departments`;
  private useMockData = environment.useMockData; // Use environment setting

  // Mock department data
  private mockDepartments: Department[] = [
    { id: 1, department_name: 'HR', department_code: 'HR-001', is_active: true },
    { id: 2, department_name: 'Engineering', department_code: 'ENG-001', is_active: true },
    { id: 3, department_name: 'Finance', department_code: 'FIN-001', is_active: true },
    { id: 4, department_name: 'Marketing', department_code: 'MKT-001', is_active: true },
    { id: 5, department_name: 'Sales', department_code: 'SLS-001', is_active: true },
    { id: 7, department_name: 'IT', department_code: 'IT-001', is_active: true },
    { id: 8, department_name: 'Administration', department_code: 'ADM-001', is_active: true },
    { id: 9, department_name: 'Customer Support', department_code: 'CS-001', is_active: true },
    { id: 10, department_name: 'Accounting', department_code: 'ACC-001', is_active: true },
    { id: 11, department_name: 'Human Resources', department_code: 'HR-002', is_active: false }
  ];

  constructor(private http: HttpClient) { }

  getDepartments(companyId?: number): Observable<Department[]> {
    if (this.useMockData) {
      let filteredDepartments = [...this.mockDepartments];
      
      if (companyId) {
        // Filter by company ID (mock implementation)
        filteredDepartments = filteredDepartments.filter(
          dept => dept.department_company_id === companyId
        );
      }
      
      return of(filteredDepartments).pipe(delay(300));
    }
    
    let params = new HttpParams();
    
    if (companyId) {
      params = params.set('company_id', companyId.toString());
    }

    return this.http.get<Department[]>(this.apiUrl, { params });
  }

  getDepartmentById(id: number): Observable<Department> {
    if (this.useMockData) {
      const department = this.mockDepartments.find(d => d.id === id);
      
      if (department) {
        return of(department).pipe(delay(200));
      } else {
        return of({ id: 0, department_name: 'Unknown', is_active: false });
      }
    }
    
    return this.http.get<Department>(`${this.apiUrl}/${id}`);
  }

  getActiveDepartments(): Observable<Department[]> {
    if (this.useMockData) {
      const activeDepartments = this.mockDepartments.filter(d => d.is_active);
      return of(activeDepartments).pipe(delay(300));
    }
    
    return this.http.get<Department[]>(`${this.apiUrl}?is_active=true`);
  }
}
