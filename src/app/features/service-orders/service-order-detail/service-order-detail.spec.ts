import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { DiagnosesService } from '@core/services/diagnoses/diagnoses';
import { QuotesService } from '@core/services/quotes/quotes';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { ServiceOrderDetail } from '@core/models/service-order.interface';
import { Diagnosis } from '@core/models/diagnoses.interface';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import ServiceOrderDetailComponent from './service-order-detail';

describe('ServiceOrderDetailComponent', () => {
  let fixture: ComponentFixture<ServiceOrderDetailComponent>;
  const orderId = 'order-1';
  const order: ServiceOrderDetail = {
    id: orderId,
    code: 'SO-0001',
    workshopId: 'workshop-1',
    customerId: 'customer-1',
    customer: { id: 'customer-1', fullName: 'Ana Pérez' },
    vehicleId: 'vehicle-1',
    vehicle: { id: 'vehicle-1', brand: 'Toyota', model: 'Corolla', plate: '1234-ABC' },
    assignedTechnicianId: null,
    assignedTechnician: null,
    status: 'RECEIVED',
    priority: 'NORMAL',
    reportedIssues: 'Ruido al frenar',
    receptionNotes: null,
    mileageIn: 42_000,
    fuelLevel: 'HALF',
    estimatedDeliveryDate: null,
    diagnosisCount: 0,
    createdAt: '2026-08-27T10:15:00.000Z',
    updatedAt: '2026-08-27T10:15:00.000Z',
    createdBy: { userId: 'advisor-1', displayName: 'Laura Gómez' },
    statusHistory: [],
  };
  const diagnosis: Diagnosis = {
    id: 'diagnosis-1',
    serviceOrderId: orderId,
    technician: { userId: 'user-1', displayName: 'Ada' },
    description: 'Ruido en frenos',
    requiredPartsNotes: null,
    suggestedLabor: null,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  function createWith(overrides: {
    serviceOrders?: Partial<ServiceOrdersService>;
    diagnoses?: Partial<DiagnosesService>;
    quotes?: Partial<QuotesService>;
  }) {
    TestBed.configureTestingModule({
      imports: [ServiceOrderDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ orderId }) } },
        },
        {
          provide: PermissionsService,
          useValue: {
            canManageOrders: () => true,
            canWriteOrders: () => true,
            canWriteQuotes: () => true,
          },
        },
        {
          provide: ServiceOrdersService,
          useValue: {
            get: () => of(order),
            listAssignableTechnicians: () => of([]),
            ...(overrides.serviceOrders ?? {}),
          },
        },
        {
          provide: DiagnosesService,
          useValue: overrides.diagnoses ?? { list: () => of([]) },
        },
        { provide: QuotesService, useValue: overrides.quotes ?? { list: () => of([]) } },
      ],
    });
    fixture = TestBed.createComponent(ServiceOrderDetailComponent);
    return fixture.componentInstance;
  }

  it('loads the order together with its diagnoses and quotes', () => {
    const component = createWith({
      diagnoses: { list: () => of([diagnosis]) },
    });

    expect(component.order()).toEqual(order);
    expect(component.diagnoses()).toEqual([diagnosis]);
    expect(component.loading()).toBe(false);
  });

  it('treats diagnosis/quote loading failures as empty lists instead of a full error', () => {
    const component = createWith({
      diagnoses: { list: () => throwError(() => new Error('fail')) },
    });

    expect(component.diagnoses()).toEqual([]);
    expect(component.error()).toBeNull();
  });

  it('shows a load error when the order itself cannot be fetched', () => {
    const component = createWith({
      serviceOrders: { get: () => throwError(() => new Error('fail')) },
    });

    expect(component.error()).toBe('No pudimos cargar la orden de servicio.');
  });

  it('derives the allowed next statuses for the current order', () => {
    const component = createWith({});

    expect(component.nextStatuses()).toEqual(['DIAGNOSIS', 'CANCELLED']);
  });

  it('prevents native navigation from both order action forms', () => {
    const component = createWith({});

    component.openStatusDialog();
    fixture.detectChanges();
    const changeStatus = vi.spyOn(component, 'changeStatus');
    const statusSubmit = new Event('submit', { bubbles: true, cancelable: true });
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(statusSubmit);

    expect(statusSubmit.defaultPrevented).toBe(true);
    expect(changeStatus).toHaveBeenCalledOnce();

    component.openDiagnosisDialog();
    fixture.detectChanges();
    const addDiagnosis = vi.spyOn(component, 'addDiagnosis');
    const diagnosisSubmit = new Event('submit', { bubbles: true, cancelable: true });
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(diagnosisSubmit);

    expect(diagnosisSubmit.defaultPrevented).toBe(true);
    expect(addDiagnosis).toHaveBeenCalledOnce();
  });

  it('changes the status and reloads the order on success', () => {
    const changeStatus = vi.fn(() => of(order));
    const get = vi.fn(() => of(order));
    const component = createWith({ serviceOrders: { get, changeStatus } });

    component.openStatusDialog();
    component.statusForm.setValue({ status: 'DIAGNOSIS', comment: '' });
    component.changeStatus();

    expect(changeStatus).toHaveBeenCalledWith(orderId, { status: 'DIAGNOSIS', comment: null });
    expect(get).toHaveBeenCalledTimes(2);
    expect(component.dialog()).toBeNull();
  });

  it('shows the server error message when the status change fails', () => {
    const component = createWith({
      serviceOrders: {
        get: () => of(order),
        changeStatus: () => throwError(() => ({ error: { message: 'Transición inválida.' } })),
      },
    });

    component.openStatusDialog();
    component.statusForm.setValue({ status: 'DIAGNOSIS', comment: '' });
    component.changeStatus();

    expect(component.actionError()).toBe('Transición inválida.');
    expect(component.actionPending()).toBe(false);
  });

  it('adds a diagnosis and increments the diagnosis count', () => {
    const create = vi.fn(() => of(diagnosis));
    const component = createWith({ diagnoses: { list: () => of([]), create } });

    component.openDiagnosisDialog();
    component.diagnosisForm.setValue({
      description: 'Ruido en frenos',
      requiredPartsNotes: '',
      suggestedLabor: '',
    });
    component.addDiagnosis();

    expect(create).toHaveBeenCalledWith(orderId, {
      description: 'Ruido en frenos',
      requiredPartsNotes: null,
      suggestedLabor: null,
    });
    expect(component.diagnoses()).toEqual([diagnosis]);
    expect(component.order()?.diagnosisCount).toBe(1);
    expect(component.dialog()).toBeNull();
  });

  it('shows an error when adding a diagnosis fails', () => {
    const component = createWith({
      diagnoses: { list: () => of([]), create: () => throwError(() => new Error('fail')) },
    });

    component.openDiagnosisDialog();
    component.diagnosisForm.setValue({
      description: 'Ruido en frenos',
      requiredPartsNotes: '',
      suggestedLabor: '',
    });
    component.addDiagnosis();

    expect(component.actionError()).toBe('No pudimos guardar el diagnóstico.');
    expect(component.actionPending()).toBe(false);
  });

  it('assigns available technicians and requires a choice for inactive assignments', () => {
    const technician = {
      membershipId: 'membership-1',
      userId: 'user-1',
      displayName: 'Ada',
    };
    const assignTechnician = vi.fn(() =>
      of({ ...order, assignedTechnicianId: technician.userId, assignedTechnician: technician }),
    );
    const component = createWith({
      serviceOrders: {
        listAssignableTechnicians: () => of([technician]),
        assignTechnician,
      },
    });

    component.openTechnicianDialog();
    component.selectTechnician(technician.membershipId);
    component.saveTechnician();

    expect(assignTechnician).toHaveBeenCalledWith(orderId, {
      technicianId: technician.membershipId,
    });
    expect(component.order()?.assignedTechnician).toEqual(technician);
    expect(component.dialog()).toBeNull();

    const inactive = {
      membershipId: 'inactive-membership',
      userId: 'inactive-user',
      displayName: 'Técnico anterior',
    };
    component.order.set({ ...order, assignedTechnician: inactive });
    component.openTechnicianDialog();
    expect(component.currentUnavailableTechnician()).toEqual(inactive);
    expect(component.technicianSaveDisabled()).toBe(true);
    component.selectTechnician(null);
    expect(component.technicianSaveDisabled()).toBe(false);
  });
});
