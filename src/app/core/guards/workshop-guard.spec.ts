import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth/auth';
import { workshopGuard } from './workshop-guard';

describe('workshopGuard', () => {
  let hasActiveWorkshop: boolean;

  beforeEach(() => {
    hasActiveWorkshop = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { hasActiveWorkshop: () => hasActiveWorkshop },
        },
      ],
    });
  });

  it('allows a session with an active workshop', () => {
    hasActiveWorkshop = true;

    const result = TestBed.runInInjectionContext(() =>
      workshopGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects a neutral session to workshop creation', () => {
    const result = TestBed.runInInjectionContext(() =>
      workshopGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/workshops/new');
  });
});
