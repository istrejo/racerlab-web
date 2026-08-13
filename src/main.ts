import { bootstrapApplication } from '@angular/platform-browser';
import { configureBoneyard } from 'boneyard-js/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';

configureBoneyard({
  color: 'rgba(148, 163, 184, 0.28)',
  darkColor: 'rgba(255, 255, 255, 0.08)',
  animate: 'shimmer',
  stagger: 35,
  transition: 180,
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
