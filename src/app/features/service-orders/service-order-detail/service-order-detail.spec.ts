import { TestBed } from '@angular/core/testing';
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
  const orderId = 'order-1';
  const order = { id: orderId, diagnosisCount: 0 } as ServiceOrderDetail;
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
        { provide: PermissionsService, useValue: { canWriteOrders: () => true } },
        {
          provide: ServiceOrdersService,
          useValue: overrides.serviceOrders ?? { get: () => of(order) },
        },
        {
          provide: DiagnosesService,
          useValue: overrides.diagnoses ?? { list: () => of([]) },
        },
        { provide: QuotesService, useValue: overrides.quotes ?? { list: () => of([]) } },
      ],
    });
    return TestBed.createComponent(ServiceOrderDetailComponent).componentInstance;
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

  it('lists the allowed next statuses for the current status', () => {
    const component = createWith({});

    expect(component.allowedNextStatuses('RECEIVED')).toEqual(['DIAGNOSIS', 'CANCELLED']);
    expect(component.allowedNextStatuses('DELIVERED')).toEqual([]);
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
});
