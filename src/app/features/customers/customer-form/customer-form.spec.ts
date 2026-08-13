import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CustomerFormComponent } from './customer-form';

describe('CustomerFormComponent', () => {
  let component: CustomerFormComponent;
  let fixture: ComponentFixture<CustomerFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerFormComponent);
    component = fixture.componentInstance;
  });

  it('normalizes form values before submission', () => {
    const emit = vi.spyOn(component.submitted, 'emit');
    component.form.setValue({
      fullName: '  Ada Lovelace  ',
      phone: '  555 0101  ',
      whatsapp: '   ',
      email: '  ADA@EXAMPLE.COM ',
      document: '  ab-12 ',
      address: '',
      notes: '  Cliente preferente  ',
    });

    component.submit();

    expect(emit).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      phone: '555 0101',
      whatsapp: null,
      email: 'ada@example.com',
      document: 'ab-12',
      address: null,
      notes: 'Cliente preferente',
    });
  });

  it('does not submit invalid or pending forms', () => {
    const emit = vi.spyOn(component.submitted, 'emit');
    component.submit();
    fixture.componentRef.setInput('pending', true);
    component.form.controls.fullName.setValue('Ada');
    component.submit();

    expect(emit).not.toHaveBeenCalled();
  });
});
