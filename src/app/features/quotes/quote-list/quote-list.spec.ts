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

  it('waits 300 ms and loads the page/status/search from the URL', async () => {
    await vi.advanceTimersByTimeAsync(300);

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
    });
  });

  it('shows an error message when the request fails', async () => {
    listForWorkshop.mockReturnValue(
      new Observable((subscriber) => subscriber.error(new Error('fail'))),
    );

    await vi.advanceTimersByTimeAsync(300);

    expect(fixture.componentInstance.error()).toBe('No pudimos cargar las cotizaciones.');
  });
});
