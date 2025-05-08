import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: false
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() showClockButtons: boolean = false;
  @Input() isClockIn: boolean = true;
  
  @Output() clockIn = new EventEmitter<void>();
  @Output() clockOut = new EventEmitter<void>();
  
  constructor() { }
  
  onClockIn(): void {
    this.clockIn.emit();
  }
  
  onClockOut(): void {
    this.clockOut.emit();
  }
}