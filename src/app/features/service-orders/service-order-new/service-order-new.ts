import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Customer, CustomerPage } from '@core/models/customer.interface';
import { ServiceOrderInput, TechnicianSummary } from '@core/models/service-order.interface';
import { Vehicle } from '@core/models/vehicle.interface';
import { CustomersService } from '@core/services/customers/customers';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { CustomerCreateDialogComponent } from '../../customers/customer-create-dialog/customer-create-dialog';
import { VehicleCreateDialogComponent } from '../../vehicles/vehicle-create-dialog/vehicle-create-dialog';
import { TechnicianSelectComponent } from '../technician-select/technician-select';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

type Step = 'customer' | 'vehicle' | 'reception';
type CustomerQuery = { search: string; page: number };

const FUEL_OPTIONS = ['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'] as const;
const PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

@Component({
  selector: 'app-service-order-new',
  imports: [
    CustomerCreateDialogComponent,
    ReactiveFormsModule,
    RouterLink,
    TechnicianSelectComponent,
    VehicleCreateDialogComponent,
  ],
  templateUrl: './service-order-new.html',
})
export default class ServiceOrderNewComponent {
  private readonly customers = inject(CustomersService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly serviceOrders = inject(ServiceOrdersService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly customerQuery = new BehaviorSubject<CustomerQuery>({ search: '', page: 1 });
  private readonly vehicleCustomerId = new Subject<string | null>();
  private readonly technicianReload = new BehaviorSubject<void>(undefined);

  readonly step = signal<Step>('customer');
  readonly customerSearch = new FormControl('', { nonNullable: true });
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly selectedVehicle = signal<Vehicle | null>(null);
  readonly customersPage = signal<CustomerPage | null>(null);
  readonly vehicles = signal<Vehicle[] | null>(null);
  readonly customerLoading = signal(true);
  readonly vehicleLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly customerDialogOpen = signal(false);
  readonly vehicleDialogOpen = signal(false);
  readonly technicians = signal<TechnicianSummary[]>([]);
  readonly techniciansLoading = signal(true);
  readonly techniciansError = signal<string | null>(null);
  readonly selectedTechnicianId = signal<string | null>(null);

  readonly fuelOptions = FUEL_OPTIONS;
  readonly priorityOptions = PRIORITY_OPTIONS;

  readonly form = new FormGroup({
    priority: new FormControl<string | null>('NORMAL'),
    reportedIssues: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(5000),
    }),
    receptionNotes: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(5000),
    }),
    mileageIn: new FormControl<number | null>(null, { validators: [Validators.min(0)] }),
    fuelLevel: new FormControl<string | null>(null),
    estimatedDeliveryDate: new FormControl<string | null>(null),
  });

  constructor() {
    this.customerSearch.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => this.customerQuery.next({ search, page: 1 }));

    this.customerQuery
      .pipe(
        distinctUntilChanged(
          (left, right) => left.search === right.search && left.page === right.page,
        ),
        tap(() => {
          this.customerLoading.set(true);
          this.error.set(null);
        }),
        switchMap((query) =>
          this.customers.list({ ...query, limit: 10 }).pipe(
            catchError(() => {
              this.error.set('No pudimos cargar los clientes.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        if (page) this.customersPage.set(page);
        this.customerLoading.set(false);
      });

    this.vehicleCustomerId
      .pipe(
        tap((customerId) => {
          this.vehicleLoading.set(customerId !== null);
          this.error.set(null);
        }),
        switchMap((customerId) =>
          customerId
            ? this.vehiclesService.list(customerId, { page: 1, limit: 100 }).pipe(
                catchError(() => {
                  this.error.set('No pudimos cargar los vehículos.');
                  return of(null);
                }),
              )
            : of(null),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        if (page) this.vehicles.set(page.items);
        this.vehicleLoading.set(false);
      });

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
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((technicians) => {
        if (technicians) this.technicians.set(technicians);
        this.techniciansLoading.set(false);
      });
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.selectedVehicle.set(null);
    this.vehicles.set(null);
    this.step.set('vehicle');
    this.loadVehicles(customer.id);
  }

  customerCreated(customer: Customer): void {
    this.customerDialogOpen.set(false);
    this.selectCustomer(customer);
    this.vehicleDialogOpen.set(true);
  }

  vehicleCreated(vehicle: Vehicle): void {
    this.vehicleDialogOpen.set(false);
    this.vehicles.update((vehicles) => [vehicle, ...(vehicles ?? [])]);
    this.selectVehicle(vehicle);
  }

  selectVehicle(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
    this.step.set('reception');
  }

  selectTechnician(membershipId: string | null): void {
    this.selectedTechnicianId.set(membershipId);
  }

  retryTechnicians(): void {
    this.technicianReload.next();
  }

  goToCustomerPage(page: number): void {
    this.customerQuery.next({ search: this.customerSearch.value.trim(), page });
  }

  goBack(): void {
    if (this.step() === 'vehicle') {
      this.selectedCustomer.set(null);
      this.selectedVehicle.set(null);
      this.vehicles.set(null);
      this.vehicleCustomerId.next(null);
      this.step.set('customer');
    } else if (this.step() === 'reception') {
      this.selectedVehicle.set(null);
      this.step.set('vehicle');
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    const customer = this.selectedCustomer();
    const vehicle = this.selectedVehicle();
    if (!customer || !vehicle) return;

    const value = this.form.getRawValue();
    const input: ServiceOrderInput = {
      customerId: customer.id,
      vehicleId: vehicle.id,
      technicianId: this.selectedTechnicianId(),
      priority: (value.priority as ServiceOrderInput['priority']) ?? null,
      reportedIssues: value.reportedIssues.trim() || null,
      receptionNotes: value.receptionNotes.trim() || null,
      mileageIn: value.mileageIn ?? null,
      fuelLevel: (value.fuelLevel as ServiceOrderInput['fuelLevel']) ?? null,
      estimatedDeliveryDate: value.estimatedDeliveryDate || null,
    };

    this.saving.set(true);
    this.error.set(null);
    this.serviceOrders
      .create(input)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (order) => void this.router.navigate(['/service-orders', order.id]),
        error: () => this.error.set('No pudimos crear la orden de servicio.'),
      });
  }

  private loadVehicles(customerId: string): void {
    this.vehicleCustomerId.next(customerId);
  }
}
