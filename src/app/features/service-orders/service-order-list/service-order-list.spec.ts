import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { ServiceOrdersService } from '@core/services/service-orders/service-orders';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { vi } from 'vitest';
import ServiceOrderListComponent from './service-order-list';
import { ServiceOrderPage } from '@core/models/service-order.interface';

describe('ServiceOrderListComponent', () => {
  let fixture: ComponentFixture<ServiceOrderListComponent>;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let list: ReturnType<typeof vi.fn>;

  const emptyPage: ServiceOrderPage = {
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    queryParams = new BehaviorSubject(
      convertToParamMap({ search: 'Toyota', status: 'RECEIVED', page: '2' }),
    );
    list = vi.fn(() => of({ ...emptyPage, page: 2 }));

    await TestBed.configureTestingModule({
      imports: [ServiceOrderListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParams.asObservable(),
          },
        },
        {
          provide: PermissionsService,
          useValue: { canWriteOrders: () => true },
        },
        { provide: ServiceOrdersService, useValue: { list } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceOrderListComponent);
  });

  afterEach(() => vi.useRealTimers());

  it('loads the page represented in the URL immediately', () => {
    expect(list).toHaveBeenCalledWith({
      search: 'Toyota',
      status: 'RECEIVED',
      page: 2,
      limit: 20,
    });
    expect(fixture.componentInstance.page()?.page).toBe(2);
  });

  it('cancels the previous request when URL parameters change', async () => {
    const cancelled = vi.fn();
    let requestNumber = 0;
    list.mockImplementation(
      () =>
        new Observable<ServiceOrderPage>(() => {
          requestNumber += 1;
          return requestNumber === 1 ? cancelled : undefined;
        }),
    );

    queryParams.next(convertToParamMap({ search: 'ABC', page: '1' }));
    queryParams.next(convertToParamMap({ search: 'DEF', page: '1' }));
    expect(cancelled).toHaveBeenCalledOnce();

    expect(list).toHaveBeenLastCalledWith({ search: 'DEF', page: 1, limit: 20 });
  });

  it('writes a trimmed search and resets page to the URL', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.search.setValue('  SO-0001  ');

    fixture.componentInstance.applySearch();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { search: 'SO-0001', page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('prevents native navigation when the search form is submitted', () => {
    fixture.detectChanges();
    const applySearch = vi.spyOn(fixture.componentInstance, 'applySearch');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(applySearch).toHaveBeenCalledOnce();
  });

  it('debounces live search and normalizes invalid statuses', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.search.setValue('SO-0002');
    await vi.advanceTimersByTimeAsync(299);
    expect(navigate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { search: 'SO-0002', page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    queryParams.next(convertToParamMap({ status: 'NOT_A_STATUS' }));
    expect(list).toHaveBeenLastCalledWith({
      search: '',
      status: undefined,
      customerId: undefined,
      vehicleId: undefined,
      page: 1,
      limit: 20,
    });
  });
});
