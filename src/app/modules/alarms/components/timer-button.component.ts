/***********************************
timer button component
    <timer-button>
***********************************/
import {
  Component,
  Input,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'timer-button',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [``],
  template: `
    <div [ngSwitch]="cancelled">
      <button
        color="primary"
        mat-button
        *ngSwitchCase="false"
        [disabled]="disabled"
        (click)="cancel($event)"
      >
        {{ label }} {{ timeLeft }} secs
      </button>
      &nbsp;
      <button
        *ngSwitchCase="true"
        mat-raised-button
        color="accent"
        (click)="action()"
      >
        <mat-icon *ngIf="icon">{{ icon }}</mat-icon>
        {{ cancelledLabel }}
      </button>
    </div>
  `
})
export class TimerButtonComponent {
  @Input() period = 5000; // timeout period in millisecondss
  @Input() label: string;
  @Input() icon: string;
  @Input() cancelledLabel: string;
  @Input() disabled: boolean;
  @Output() nextPoint: EventEmitter<void> = new EventEmitter();

  private timer: ReturnType<typeof setInterval>;
  public timeLeft: number;
  public cancelled = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.timeLeft = isNaN(this.period) ? 5 : this.period / 1000;
    this.label = this.label ?? 'Action in ';
    this.cancelledLabel = this.cancelledLabel ?? 'OK';
    this.timer = setInterval(() => {
      --this.timeLeft;
      if (this.timeLeft === 0) {
        this.disabled = true;
        this.action();
        clearInterval(this.timer);
        this.timer = null;
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  cancel(e) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.cancelled = true;
  }

  action() {
    this.nextPoint.emit();
  }
}
