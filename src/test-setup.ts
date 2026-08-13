class ResizeObserverMock implements ResizeObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): ResizeObserverEntry[] {
    return [];
  }
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverMock;
}

if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}
