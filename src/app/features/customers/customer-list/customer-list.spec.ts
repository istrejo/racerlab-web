import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { PermissionsService } from '@core/services/permissions/permissions';
import { CustomersService } from '@core/services/customers/customers';
import { CustomerPage } from '@core/models/customer.interface';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { vi } from 'vitest';
import CustomerListComponent from './customer-list';

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let list: ReturnType<typeof vi.fn>;
  const emptyPage: CustomerPage = {
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    queryParams = new BehaviorSubject(convertToParamMap({ search: ' Ada ', page: '2' }));
    list = vi.fn(() => of({ ...emptyPage, page: 2 }));

    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParams.asObservable(),
            snapshot: { queryParamMap: queryParams.value },
          },
        },
        { provide: PermissionsService, useValue: { canWriteCustomers: () => true } },
        { provide: CustomersService, useValue: { list } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
  });

  afterEach(() => vi.useRealTimers());

  it('loads and normalizes the page and filters represented in the URL', () => {
    expect(list).toHaveBeenCalledWith({
      search: 'Ada',
      hasVehicles: undefined,
      hasServiceOrders: undefined,
      sort: 'NAME_ASC',
      page: 2,
      limit: 20,
    });
    expect(fixture.componentInstance.page()?.page).toBe(2);
  });

  it('cancels the previous request when URL search parameters change', async () => {
    const cancelled = vi.fn();
    let requestNumber = 0;
    list.mockImplementation(
      () =>
        new Observable<CustomerPage>(() => {
          requestNumber += 1;
          return requestNumber === 1 ? cancelled : undefined;
        }),
    );

    queryParams.next(convertToParamMap({ search: 'Grace', page: '1' }));
    queryParams.next(convertToParamMap({ search: 'Katherine', page: '1' }));
    expect(cancelled).toHaveBeenCalledOnce();

    expect(list).toHaveBeenLastCalledWith({
      search: 'Katherine',
      hasVehicles: undefined,
      hasServiceOrders: undefined,
      sort: 'NAME_ASC',
      page: 1,
      limit: 20,
    });
  });

  it('writes a trimmed search and reset page to the URL', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.search.setValue('  Grace Hopper  ');

    fixture.componentInstance.applySearch();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { search: 'Grace Hopper', page: 1 },
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

  it('debounces live search updates and keeps the URL shareable', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.search.setValue('Grace');
    await vi.advanceTimersByTimeAsync(299);
    expect(navigate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { search: 'Grace', page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('normalizes invalid filters before calling the API', () => {
    queryParams.next(
      convertToParamMap({
        hasVehicles: 'sometimes',
        hasServiceOrders: 'yes',
        sort: 'RANDOM',
        page: '-2',
      }),
    );

    expect(list).toHaveBeenLastCalledWith({
      search: '',
      hasVehicles: undefined,
      hasServiceOrders: undefined,
      sort: 'NAME_ASC',
      page: 1,
      limit: 20,
    });
  });
});
