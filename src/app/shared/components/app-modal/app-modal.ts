import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  templateUrl: './app-modal.html',
})
export class AppModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly busy = input(false);
  readonly dismissed = output<void>();
  readonly titleId = `app-modal-title-${nextModalId}`;
  readonly descriptionId = `app-modal-description-${nextModalId++}`;

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) return;

      if (this.open() && !element.open) {
        this.returnFocus =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (typeof element.showModal === 'function') element.showModal();
        else element.setAttribute('open', '');
        queueMicrotask(() => {
          const initialFocus =
            element.querySelector<HTMLElement>('[autofocus]') ??
            element.querySelector<HTMLElement>(
              'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
          initialFocus?.focus();
        });
      } else if (!this.open() && element.open) {
        if (typeof element.close === 'function') element.close();
        else element.removeAttribute('open');
        this.returnFocus?.focus();
        this.returnFocus = null;
      }
    });
  }

  requestDismiss(): void {
    if (!this.busy()) this.dismissed.emit();
  }

  handleCancel(event: Event): void {
    event.preventDefault();
    this.requestDismiss();
  }

  handleBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog()?.nativeElement) this.requestDismiss();
  }
}
