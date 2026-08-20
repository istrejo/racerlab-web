import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttentionListComponent, DashboardAttentionListItem } from './attention-list';

describe('AttentionListComponent', () => {
  let fixture: ComponentFixture<AttentionListComponent>;

  const items: DashboardAttentionListItem[] = [
    {
      id: 'QUO-2406',
      primary: 'Jordan Blake',
      secondary: 'QUO-2406 - 2020 Mazda CX-5',
      value: '$684.00',
      detail: 'Waiting 2 hours',
    },
  ];

  beforeEach(() => {
    fixture = TestBed.createComponent(AttentionListComponent);
    fixture.componentRef.setInput('title', 'Pending quotes');
    fixture.componentRef.setInput('description', 'Customer decisions waiting to move work forward');
    fixture.componentRef.setInput('badge', '1 waiting');
    fixture.componentRef.setInput('tone', 'warning');
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  it('renders the header content', () => {
    const fixtureElement: HTMLElement = fixture.nativeElement;
    expect(fixtureElement.textContent).toContain('Pending quotes');
    expect(fixtureElement.textContent).toContain('Customer decisions waiting to move work forward');
    expect(fixtureElement.textContent).toContain('1 waiting');
  });

  it('renders one list item per entry', () => {
    const fixtureElement: HTMLElement = fixture.nativeElement;
    const rows = fixtureElement.querySelectorAll('li');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Jordan Blake');
    expect(rows[0].textContent).toContain('$684.00');
    expect(rows[0].textContent).toContain('Waiting 2 hours');
  });
});
