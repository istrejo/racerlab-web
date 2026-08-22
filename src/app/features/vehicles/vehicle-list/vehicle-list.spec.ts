import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { vi } from 'vitest';
import VehicleListComponent from './vehicle-list';
import { VehiclePage } from '@core/models/vehicle.interface';

describe('VehicleListComponent', () => {
  let fixture: ComponentFixture<VehicleListComponent>;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let list: ReturnType<typeof vi.fn>;
  const customerId = 'cust-uuid-001';

  const emptyPage: VehiclePage = {
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    queryParams = new BehaviorSubject(convertToParamMap({ search: 'Toyota', page: '2' }));
    list = vi.fn(() => of({ ...emptyPage, page: 2 }));

    await TestBed.configureTestingModule({
      imports: [VehicleListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ customerId }) },
            queryParamMap: queryParams.asObservable(),
          },
        },
        {
          provide: PermissionsService,
          useValue: { canWriteVehicles: () => true },
        },
        { provide: VehiclesService, useValue: { list } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleListComponent);
  });

  afterEach(() => vi.useRealTimers());

  it('loads the page represented in the URL immediately', () => {
    expect(list).toHaveBeenCalledWith(customerId, { search: 'Toyota', page: 2, limit: 20 });
    expect(fixture.componentInstance.page()?.page).toBe(2);
  });

  it('cancels the previous request when URL search parameters change', async () => {
    const cancelled = vi.fn();
    let requestNumber = 0;
    list.mockImplementation(
      () =>
        new Observable<VehiclePage>(() => {
          requestNumber += 1;
          return requestNumber === 1 ? cancelled : undefined;
        }),
    );

    queryParams.next(convertToParamMap({ search: 'Honda', page: '1' }));
    queryParams.next(convertToParamMap({ search: 'Mazda', page: '1' }));
    expect(cancelled).toHaveBeenCalledOnce();

    expect(list).toHaveBeenLastCalledWith(customerId, { search: 'Mazda', page: 1, limit: 20 });
  });

  it('writes a trimmed search and reset page to the URL', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.search.setValue('  Corolla  ');

    fixture.componentInstance.applySearch();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { search: 'Corolla', page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('debounces live search updates', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.search.setValue('Honda');
    await vi.advanceTimersByTimeAsync(299);
    expect(navigate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { search: 'Honda', page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
