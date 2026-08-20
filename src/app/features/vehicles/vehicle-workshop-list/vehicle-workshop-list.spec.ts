import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { VehiclesService } from '@core/services/vehicles/vehicles';
import { VehicleWithCustomerPage } from '@core/models/vehicle.interface';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { vi } from 'vitest';
import VehicleWorkshopListComponent from './vehicle-workshop-list';

describe('VehicleWorkshopListComponent', () => {
  let fixture: ComponentFixture<VehicleWorkshopListComponent>;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let listForWorkshop: ReturnType<typeof vi.fn>;

  const emptyPage: VehicleWithCustomerPage = {
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    queryParams = new BehaviorSubject(convertToParamMap({ search: ' ABC ', page: '2' }));
    listForWorkshop = vi.fn(() => of({ ...emptyPage, page: 2 }));

    await TestBed.configureTestingModule({
      imports: [VehicleWorkshopListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParams.asObservable(),
            snapshot: { queryParamMap: queryParams.value },
          },
        },
        { provide: VehiclesService, useValue: { listForWorkshop } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleWorkshopListComponent);
  });

  afterEach(() => vi.useRealTimers());

  it('waits 300 ms and loads the page represented in the URL', async () => {
    await vi.advanceTimersByTimeAsync(299);
    expect(listForWorkshop).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(listForWorkshop).toHaveBeenCalledWith({ search: 'ABC', page: 2, limit: 20 });
    expect(fixture.componentInstance.page()?.page).toBe(2);
  });

  it('cancels the previous request when URL search parameters change', async () => {
    const cancelled = vi.fn();
    let requestNumber = 0;
    listForWorkshop.mockImplementation(
      () =>
        new Observable<VehicleWithCustomerPage>(() => {
          requestNumber += 1;
          return requestNumber === 1 ? cancelled : undefined;
        }),
    );

    await vi.advanceTimersByTimeAsync(300);
    queryParams.next(convertToParamMap({ search: 'XYZ', page: '1' }));
    expect(cancelled).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(300);

    expect(listForWorkshop).toHaveBeenLastCalledWith({ search: 'XYZ', page: 1, limit: 20 });
  });

  it('writes a trimmed search and reset page to the URL', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.search.setValue('  ABC1234  ');

    fixture.componentInstance.applySearch();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { search: 'ABC1234', page: 1 },
      queryParamsHandling: 'merge',
    });
  });

  it('shows an error and allows retrying', async () => {
    listForWorkshop.mockReturnValue(
      new Observable((subscriber) => subscriber.error(new Error('fail'))),
    );
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await vi.advanceTimersByTimeAsync(300);

    expect(fixture.componentInstance.error()).toBe('No pudimos cargar los vehículos.');

    fixture.componentInstance.retry();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParamsHandling: 'merge' }),
    );
  });
});
