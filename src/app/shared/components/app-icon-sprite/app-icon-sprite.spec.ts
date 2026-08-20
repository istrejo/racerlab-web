import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppIconSpriteComponent } from './app-icon-sprite';

describe('AppIconSpriteComponent', () => {
  let fixture: ComponentFixture<AppIconSpriteComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AppIconSpriteComponent);
  });

  it('creates without errors', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders an SVG sprite', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('svg')).not.toBeNull();
  });
});
