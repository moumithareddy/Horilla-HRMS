import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { AttendanceService } from './core/services/attendance.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Horilla HRMS - Attendance Management';
  
  constructor(
    private router: Router,
    private attendanceService: AttendanceService
  ) {}
  
  ngOnInit() {
    // Clock timer and sidebar toggle functionality removed
  }
  
  ngOnDestroy() {
    // No timers or subscriptions to clean up
  }
  
  // Clock-in and clock-out functions moved to individual components
}
