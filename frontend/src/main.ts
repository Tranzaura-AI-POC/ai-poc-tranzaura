import './polyfills';
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { HomepageComponent } from './app/homepage.component';
import { AppointmentsComponent } from './app/appointments.component';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserAnimationsModule, HttpClientModule),
    provideRouter([
      { path: '', component: HomepageComponent },
      { path: 'appointments', component: AppointmentsComponent }
    ])
  ]
}).catch(err => console.error(err));
