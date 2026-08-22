import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { QuotesService } from '@core/services/quotes/quotes';
import { QuotePage } from '@core/models/quotes.interface';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { vi } from 'vitest';
import QuoteListComponent from './quote-list';

describe('QuoteListComponent', () => {
  let fixture: ComponentFixture<QuoteListComponent>;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let listForWorkshop: ReturnType<typeof vi.fn>;

  const emptyPage: QuotePage = { items: [], page: 1, limit: 20, total: 0, totalPages: 0 };

  beforeEach(async () => {
    vi.useFakeTimers();
    queryParams = new BehaviorSubject(
      convertToParamMap({ search: ' Ada ', status: 'ACTIVE', page: '2' }),
    );
    listForWorkshop = vi.fn(() => of({ ...emptyPage, page: 2 }));

    await TestBed.configureTestingModule({
      imports: [QuoteListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParams.asObservable(),
            snapshot: { queryParamMap: queryParams.value },
          },
        },
        { provide: QuotesService, useValue: { listForWorkshop } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteListComponent);
  });

  afterEach(() => vi.useRealTimers());

  it('loads the page/status/search from the URL immediately', () => {
    expect(listForWorkshop).toHaveBeenCalledWith({
      search: 'Ada',
      status: 'ACTIVE',
      page: 2,
      limit: 20,
    });
    expect(fixture.componentInstance.page()?.page).toBe(2);
    expect(fixture.componentInstance.selectedStatus()).toBe('ACTIVE');
  });

  it('filters by status and resets the page', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.filterByStatus('DRAFT');

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { status: 'DRAFT', page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('writes a trimmed search and resets the page', () => {
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

  it('navigates to a specific page', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToPage(5);

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { page: 5 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('shows an error message when the request fails', () => {
    listForWorkshop.mockReturnValue(
      new Observable((subscriber) => subscriber.error(new Error('fail'))),
    );
    queryParams.next(convertToParamMap({ search: 'trigger-error' }));

    expect(fixture.componentInstance.error()).toBe('No pudimos cargar las cotizaciones.');
  });

  it('debounces live search and normalizes invalid statuses', async () => {
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

    queryParams.next(convertToParamMap({ status: 'NOT_A_STATUS' }));
    expect(listForWorkshop).toHaveBeenLastCalledWith({
      search: '',
      status: undefined,
      page: 1,
      limit: 20,
    });
  });
});
