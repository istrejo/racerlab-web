import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSkeletonComponent } from './loading-skeleton';

@Component({
  imports: [LoadingSkeletonComponent],
  template: `
    <app-loading-skeleton
      label="Cargando clientes…"
      name="customers"
      variant="table"
      [loading]="loading()"
    >
      <p data-content>Clientes listos</p>
    </app-loading-skeleton>
  `,
})
class SkeletonHostComponent {
  readonly loading = signal(true);
}

describe('LoadingSkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonHostComponent);
  });

  it('renders an accessible Boneyard skeleton while loading', () => {
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[data-boneyard="customers"]')).not.toBeNull();
    expect(element.querySelector('[data-loading="customers"]')?.textContent).toContain(
      'Cargando clientes',
    );
    expect(element.querySelectorAll('[data-boneyard-bone]').length).toBeGreaterThan(0);
    expect(element.querySelector('[data-content]')).toBeNull();
  });

  it('projects real content after loading finishes', () => {
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-boneyard]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-content]')?.textContent).toContain(
      'Clientes listos',
    );
  });
});
