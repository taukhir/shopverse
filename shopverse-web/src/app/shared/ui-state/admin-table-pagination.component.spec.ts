import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AdminTablePaginationComponent } from './admin-table-pagination.component';

describe('AdminTablePaginationComponent', () => {
  it('shows the current range and disables unavailable navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTablePaginationComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminTablePaginationComponent);
    fixture.componentRef.setInput('label', '9-16 of 16');
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('pageCount', 2);
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    expect(fixture.nativeElement.textContent).toContain('9-16 of 16');
    expect(fixture.nativeElement.textContent).toContain('Page 2 of 2');
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);
    expect(buttons[0].getAttribute('aria-label')).toBe('Previous page');
  });

  it('emits the requested page from keyboard-accessible buttons', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTablePaginationComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminTablePaginationComponent);
    fixture.componentRef.setInput('label', '1-8 of 16');
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('pageCount', 2);
    const requested: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => requested.push(page));
    fixture.detectChanges();

    const nextButton = fixture.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement;
    nextButton.click();
    expect(requested).toEqual([2]);
  });
});
