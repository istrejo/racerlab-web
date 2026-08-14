import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { Customer, CustomersService } from '@core/services/customers/customers';
import { of, throwError } from 'rxjs';
import { CustomerDetailComponent } from './customer-detail';

describe('CustomerDetailComponent', () => {
  let fixture: ComponentFixture<CustomerDetailComponent>;
  const canDelete = signal(false);
  const customer: Customer = {
    id: 'customer-1',
    fullName: 'Ada Lovelace',
    phone: null,
    whatsapp: null,
    email: null,
    document: null,
    address: null,
    notes: null,
    vehicleCount: 2,
    serviceOrderCount: 4,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  beforeEach(() => {
    canDelete.set(false);
    TestBed.configureTestingModule({
      imports: [CustomerDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: customer.id }) } },
        },
        {
          provide: PermissionsService,
          useValue: {
            canWriteCustomers: () => false,
            canDeleteCustomers: canDelete,
          },
        },
        {
          provide: CustomersService,
          useValue: {
            get: () => of(customer),
            remove: () => throwError(() => ({ status: 409 })),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
  });

  it('shows customer counters while hiding manager actions from technicians', () => {
    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('4');
    expect(fixture.nativeElement.textContent).not.toContain('Editar cliente');
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar cliente');
  });

  it('shows deletion only to allowed roles and translates relation conflicts', () => {
    canDelete.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Eliminar cliente');

    fixture.componentInstance.remove();
    fixture.detectChanges();

    expect(fixture.componentInstance.deleteError()).toBe(
      'No se puede eliminar: el cliente tiene vehículos u órdenes asociados.',
    );
  });
});
