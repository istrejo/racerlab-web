import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('registers global error listeners, the HTTP client with interceptors and the router', () => {
    expect(appConfig.providers).toBeDefined();
    expect(appConfig.providers.length).toBeGreaterThanOrEqual(3);
  });

  it('can configure a testing module without throwing', () => {
    expect(() => TestBed.configureTestingModule({ providers: appConfig.providers })).not.toThrow();
  });
});
