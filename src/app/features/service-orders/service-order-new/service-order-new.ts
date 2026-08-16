import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Customer, CustomerPage } from '@core/models/customer.interface';
import { ServiceOrderInput } from '@core/models/service-order.interface';
import { Vehicle } from '@core/models/vehicle.interface';
import { CustomersService } from '@core/services/customers/customers';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

type Step = 'customer' | 'vehicle' | 'reception';

const FUEL_OPTIONS = ['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'] as const;

const PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

@Component({
  selector: 'app-service-order-new',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './service-order-new.html',
})
export default class ServiceOrderNewComponent {
  private readonly customers = inject(CustomersService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly serviceOrders = inject(ServiceOrdersService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal<Step>('customer');
  readonly customerSearch = new FormControl('', { nonNullable: true });
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly selectedVehicle = signal<Vehicle | null>(null);
  readonly customersPage = signal<CustomerPage | null>(null);
  readonly vehicles = signal<Vehicle[] | null>(null);
  readonly customerLoading = signal(false);
  readonly vehicleLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

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
        distinctUntilChanged(),
        map((value) => value.trim()),
        tap(() => {
          this.customerLoading.set(true);
          this.error.set(null);
        }),
        switchMap((search: string) =>
          search.length >= 2
            ? this.customers.list({ search, page: 1, limit: 10 })
            : of({ items: [], page: 1, limit: 10, total: 0, totalPages: 0 } as CustomerPage),
        ),
        catchError(() => {
          this.error.set('No pudimos buscar clientes.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.customersPage.set(page);
        this.customerLoading.set(false);
      });

    effect(() => {
      const customer = this.selectedCustomer();
      if (customer) {
        this.vehicleLoading.set(true);
        this.vehicles.set(null);
        this.vehiclesService
          .list(customer.id, { page: 1, limit: 100 })
          .pipe(
            catchError(() => {
              this.error.set('No pudimos cargar los vehículos.');
              return of(null);
            }),
          )
          .subscribe((page) => {
            this.vehicles.set(page?.items ?? []);
            this.vehicleLoading.set(false);
          });
      }
    });
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.step.set('vehicle');
    this.customersPage.set(null);
    this.customerSearch.setValue('');
  }

  selectVehicle(vehicle: Vehicle): void {
    this.selectedVehicle.set(vehicle);
    this.step.set('reception');
  }

  goBack(): void {
    if (this.step() === 'vehicle') this.step.set('customer');
    else if (this.step() === 'reception') this.step.set('vehicle');
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
      priority: (value.priority as ServiceOrderInput['priority']) ?? null,
      reportedIssues: value.reportedIssues.trim() || null,
      receptionNotes: value.receptionNotes.trim() || null,
      mileageIn: value.mileageIn ?? null,
      fuelLevel: (value.fuelLevel as ServiceOrderInput['fuelLevel']) ?? null,
      estimatedDeliveryDate: value.estimatedDeliveryDate || null,
    };

    this.saving.set(true);
    this.error.set(null);
    this.serviceOrders.create(input).subscribe({
      next: (order) => void this.router.navigate(['/service-orders', order.id]),
      error: () => {
        this.saving.set(false);
        this.error.set('No pudimos crear la orden de servicio.');
      },
    });
  }
}
