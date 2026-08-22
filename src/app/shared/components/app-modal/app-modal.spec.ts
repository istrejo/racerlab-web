import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppModalComponent } from './app-modal';

@Component({
  imports: [AppModalComponent],
  template: `
    <button #trigger type="button">Abrir</button>
    <app-modal title="Crear cliente" [open]="open()" [busy]="busy()" (dismissed)="open.set(false)">
      <button autofocus type="button">Contenido</button>
    </app-modal>
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly busy = signal(false);
}

describe('AppModalComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
  });

  it('opens as an accessible labelled dialog and restores focus', async () => {
    const host = fixture.componentInstance;
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.focus();

    host.open.set(true);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`#${titleId}`)?.textContent).toContain(
      'Crear cliente',
    );
    await Promise.resolve();
    expect(document.activeElement?.textContent).toContain('Contenido');

    host.open.set(false);
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger);
  });

  it('prevents dismissal while busy', () => {
    const host = fixture.componentInstance;
    host.open.set(true);
    host.busy.set(true);
    fixture.detectChanges();

    const event = new Event('cancel', { cancelable: true });
    fixture.nativeElement.querySelector('dialog').dispatchEvent(event);
    expect(host.open()).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('dismisses with Escape when it is not busy', () => {
    const host = fixture.componentInstance;
    host.open.set(true);
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('dialog')
      .dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(host.open()).toBe(false);
  });
});
