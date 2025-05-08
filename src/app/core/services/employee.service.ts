import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) { }

  getEmployees(departmentId?: number, status?: string): Observable<Employee[]> {
    let params = new HttpParams();
    
    if (departmentId) {
      params = params.set('department_id', departmentId.toString());
    }
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Employee[]>(this.apiUrl, { params });
  }

  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  searchEmployees(query: string): Observable<Employee[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Employee[]>(`${this.apiUrl}/search`, { params });
  }

  getActiveEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}?status=active`);
  }
}
