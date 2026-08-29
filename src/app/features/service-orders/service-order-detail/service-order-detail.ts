import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Diagnosis } from '@core/models/diagnoses.interface';
import { Quote, QuoteStatus } from '@core/models/quotes.interface';
import {
  ServiceOrderDetail,
  ServiceOrderStatus,
  TechnicianSummary,
} from '@core/models/service-order.interface';
import {
  SERVICE_ORDER_STATUS_LABELS,
  SERVICE_ORDER_STATUS_TONES,
} from '@core/models/service-order-status';
import { DiagnosesService } from '@core/services/diagnoses/diagnoses';
import { PermissionsService } from '@core/services/permissions/permissions';
import { QuotesService } from '@core/services/quotes/quotes';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton';
import { AppModalComponent } from '@shared/components/app-modal/app-modal';
import { catchError, forkJoin, of, Subject, switchMap, tap } from 'rxjs';
import { TechnicianSelectComponent } from '../technician-select/technician-select';

type DialogMode = 'status' | 'diagnosis' | 'technician' | null;

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

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

@Component({
  selector: 'app-service-order-detail',
  imports: [
    AppModalComponent,
    DatePipe,
    DecimalPipe,
    LoadingSkeletonComponent,
    ReactiveFormsModule,
    RouterLink,
    TechnicianSelectComponent,
  ],
  templateUrl: './service-order-detail.html',
})
export default class ServiceOrderDetailComponent {
  readonly permissions = inject(PermissionsService);
  private readonly serviceOrders = inject(ServiceOrdersService);
  private readonly diagnosesService = inject(DiagnosesService);
  private readonly quotesService = inject(QuotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly technicianReload = new Subject<void>();

  readonly orderId = this.route.snapshot.paramMap.get('orderId') ?? '';
  readonly order = signal<ServiceOrderDetail | null>(null);
  readonly diagnoses = signal<Diagnosis[]>([]);
  readonly quotes = signal<Quote[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionPending = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly dialog = signal<DialogMode>(null);
  readonly technicians = signal<TechnicianSummary[]>([]);
  readonly techniciansLoading = signal(false);
  readonly techniciansError = signal<string | null>(null);
  readonly selectedTechnicianId = signal<string | null>(null);
  readonly currentUnavailableTechnician = signal<TechnicianSummary | null>(null);
  readonly technicianSelectionExplicit = signal(true);
  readonly technicianActionLabel = computed(() =>
    this.order()?.assignedTechnician ? 'Cambiar técnico' : 'Asignar técnico',
  );
  readonly technicianSaveDisabled = computed(
    () => this.actionPending() || this.techniciansLoading() || !this.technicianSelectionExplicit(),
  );
  readonly nextStatuses = computed(() => {
    const current = this.order()?.status;
    return current ? ALLOWED_TRANSITIONS[current] : [];
  });

  readonly statusLabels = SERVICE_ORDER_STATUS_LABELS;
  readonly statusTones = SERVICE_ORDER_STATUS_TONES;
  readonly fuelLabels = FUEL_LABELS;
  readonly priorityLabels = PRIORITY_LABELS;
  readonly quoteStatusLabels = QUOTE_STATUS_LABELS;

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
    this.technicianReload
      .pipe(
        tap(() => {
          this.techniciansLoading.set(true);
          this.techniciansError.set(null);
        }),
        switchMap(() =>
          this.serviceOrders.listAssignableTechnicians().pipe(
            catchError(() => {
              this.techniciansError.set('No pudimos cargar los técnicos.');
              const current = this.order()?.assignedTechnician ?? null;
              this.currentUnavailableTechnician.set(current);
              this.technicianSelectionExplicit.set(current === null);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((technicians) => {
        if (technicians) this.applyTechnicianAvailability(technicians);
        this.techniciansLoading.set(false);
      });
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
          return forkJoin({
            diagnoses: this.diagnosesService
              .list(order.id)
              .pipe(catchError(() => of([] as Diagnosis[]))),
            quotes: this.quotesService.list(order.id).pipe(catchError(() => of([] as Quote[]))),
          });
        }),
        catchError(() => {
          this.error.set('No pudimos cargar la orden de servicio.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((related) => {
        if (related !== null) {
          this.diagnoses.set(related.diagnoses);
          this.quotes.set(related.quotes);
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

  openTechnicianDialog(): void {
    const technician = this.order()?.assignedTechnician ?? null;
    this.selectedTechnicianId.set(technician?.membershipId ?? null);
    this.currentUnavailableTechnician.set(null);
    this.technicianSelectionExplicit.set(technician === null);
    this.actionError.set(null);
    this.dialog.set('technician');
    this.technicianReload.next();
  }

  retryTechnicians(): void {
    this.technicianReload.next();
  }

  selectTechnician(membershipId: string | null): void {
    this.selectedTechnicianId.set(membershipId);
    this.technicianSelectionExplicit.set(true);
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

  saveTechnician(): void {
    if (this.technicianSaveDisabled()) return;
    this.actionPending.set(true);
    this.actionError.set(null);

    this.serviceOrders
      .assignTechnician(this.orderId, { technicianId: this.selectedTechnicianId() })
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.actionPending.set(false);
          this.closeDialog();
        },
        error: (err: { error?: { message?: string } }) => {
          this.actionPending.set(false);
          this.actionError.set(err?.error?.message ?? 'No pudimos actualizar el técnico.');
        },
      });
  }

  private applyTechnicianAvailability(technicians: TechnicianSummary[]): void {
    this.technicians.set(technicians);
    const current = this.order()?.assignedTechnician ?? null;
    const unavailable =
      current && !technicians.some(({ membershipId }) => membershipId === current.membershipId)
        ? current
        : null;
    this.currentUnavailableTechnician.set(unavailable);
    this.technicianSelectionExplicit.set(unavailable === null);
  }
}
