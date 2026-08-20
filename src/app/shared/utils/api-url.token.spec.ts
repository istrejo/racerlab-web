import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { API_URL } from './api-url.token';

describe('API_URL', () => {
  it('resolves the configured environment API URL without a trailing slash', () => {
    const value = TestBed.runInInjectionContext(() => TestBed.inject(API_URL));

    expect(value).toBe(environment.API_URL.replace(/\/$/, ''));
    expect(value.endsWith('/')).toBe(false);
  });
});
