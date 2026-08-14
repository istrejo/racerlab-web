import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DiagnosesService, Diagnosis } from '@core/services/diagnoses/diagnoses';
import { PermissionsService } from '@core/services/permissions/permissions';
import {
  ServiceOrderStatus,
  ServiceOrdersService,
  ServiceOrderDetail,
} from '@core/services/service-orders/service-orders';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { catchError, of, switchMap } from 'rxjs';

type DialogMode = 'status' | 'diagnosis' | null;

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  RECEIVED: 'Recibida',
  DIAGNOSIS: 'Diagnóstico',
  QUOTED: 'Cotizada',
  APPROVED: 'Aprobada',
  IN_PROGRESS: 'En progreso',
  QUALITY_CONTROL: 'Control de calidad',
  READY_FOR_DELIVERY: 'Lista para entrega',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

const ALLOWED_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  RECEIVED: ['DIAGNOSIS', 'CANCELLED'],
  DIAGNOSIS: ['QUOTED', 'CANCELLED'],
  QUOTED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['QUALITY_CONTROL', 'CANCELLED'],
  QUALITY_CONTROL: ['READY_FOR_DELIVERY', 'IN_PROGRESS'],
  READY_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const FUEL_LABELS: Record<string, string> = {
  EMPTY: 'Vacío',
  QUARTER: '1/4',
  HALF: '1/2',
  THREE_QUARTERS: '3/4',
  FULL: 'Lleno',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

@Component({
  selector: 'app-service-order-detail',
  imports: [DatePipe, DecimalPipe, LoadingSkeletonComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './service-order-detail.html',
})
export class ServiceOrderDetailComponent {
  readonly permissions = inject(PermissionsService);
  private readonly serviceOrders = inject(ServiceOrdersService);
  private readonly diagnosesService = inject(DiagnosesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
  readonly order = signal<ServiceOrderDetail | null>(null);
  readonly diagnoses = signal<Diagnosis[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionPending = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly dialog = signal<DialogMode>(null);

  readonly statusLabels = STATUS_LABELS;
  readonly fuelLabels = FUEL_LABELS;
  readonly priorityLabels = PRIORITY_LABELS;

  readonly statusForm = new FormGroup({
    status: new FormControl<ServiceOrderStatus | null>(null, { validators: Validators.required }),
    comment: new FormControl('', { nonNullable: true, validators: Validators.maxLength(2000) }),
  });

  readonly diagnosisForm = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(10000)],
    }),
    requiredPartsNotes: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(5000),
    }),
    suggestedLabor: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(5000),
    }),
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.serviceOrders
      .get(this.orderId)
      .pipe(
        switchMap((order) => {
          this.order.set(order);
          return this.diagnosesService.list(order.id).pipe(catchError(() => of([] as Diagnosis[])));
        }),
        catchError(() => {
          this.error.set('No pudimos cargar la orden de servicio.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((diagnoses) => {
        if (diagnoses !== null) {
          this.diagnoses.set(diagnoses);
        }
        this.loading.set(false);
      });
  }

  openStatusDialog(): void {
    this.dialog.set('status');
    this.statusForm.reset({ status: null, comment: '' });
    this.actionError.set(null);
  }

  openDiagnosisDialog(): void {
    this.dialog.set('diagnosis');
    this.diagnosisForm.reset({ description: '', requiredPartsNotes: '', suggestedLabor: '' });
    this.actionError.set(null);
  }

  closeDialog(): void {
    this.dialog.set(null);
    this.actionError.set(null);
  }

  changeStatus(): void {
    this.statusForm.markAllAsTouched();
    if (this.statusForm.invalid || this.actionPending()) return;

    const value = this.statusForm.getRawValue();
    this.actionPending.set(true);
    this.actionError.set(null);

    this.serviceOrders
      .changeStatus(this.orderId, {
        status: value.status as ServiceOrderStatus,
        comment: value.comment.trim() || null,
      })
      .subscribe({
        next: () => {
          this.load();
          this.closeDialog();
          this.actionPending.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.actionPending.set(false);
          this.actionError.set(err?.error?.message ?? 'No pudimos cambiar el estado.');
        },
      });
  }

  addDiagnosis(): void {
    this.diagnosisForm.markAllAsTouched();
    if (this.diagnosisForm.invalid || this.actionPending()) return;

    const value = this.diagnosisForm.getRawValue();
    this.actionPending.set(true);
    this.actionError.set(null);

    this.diagnosesService
      .create(this.orderId, {
        description: value.description.trim(),
        requiredPartsNotes: value.requiredPartsNotes.trim() || null,
        suggestedLabor: value.suggestedLabor.trim() || null,
      })
      .subscribe({
        next: (diagnosis) => {
          this.diagnoses.update((list) => [...list, diagnosis]);
          this.order.update((o) => (o ? { ...o, diagnosisCount: o.diagnosisCount + 1 } : o));
          this.closeDialog();
          this.actionPending.set(false);
        },
        error: () => {
          this.actionPending.set(false);
          this.actionError.set('No pudimos guardar el diagnóstico.');
        },
      });
  }

  allowedNextStatuses(current: ServiceOrderStatus): ServiceOrderStatus[] {
    return ALLOWED_TRANSITIONS[current] ?? [];
  }
}
