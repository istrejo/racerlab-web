import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { CustomerPage, CustomersService } from '@core/services/customers/customers';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { vi } from 'vitest';
import { CustomerListComponent } from './customer-list';

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
        { provide: AuthService, useValue: { canWriteCustomers: () => true } },
        { provide: CustomersService, useValue: { list } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
  });

  afterEach(() => vi.useRealTimers());

  it('waits 300 ms and loads the page represented in the URL', async () => {
    await vi.advanceTimersByTimeAsync(299);
    expect(list).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(list).toHaveBeenCalledWith({ search: 'Ada', page: 2, limit: 20 });
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

    await vi.advanceTimersByTimeAsync(300);
    queryParams.next(convertToParamMap({ search: 'Grace', page: '1' }));
    expect(cancelled).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(300);

    expect(list).toHaveBeenLastCalledWith({ search: 'Grace', page: 1, limit: 20 });
  });

  it('writes a trimmed search and reset page to the URL', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.search.setValue('  Grace Hopper  ');

    fixture.componentInstance.applySearch();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { search: 'Grace Hopper', page: 1 },
    });
  });
});
