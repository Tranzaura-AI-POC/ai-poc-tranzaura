import './polyfills';
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { HomepageComponent } from './app/homepage.component';
import { AppointmentsComponent } from './app/appointments.component';
import { SigninComponent } from './app/signin.component';
import { authGuard } from './app/auth.guard';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserAnimationsModule, HttpClientModule),
    provideRouter([
      { path: '', component: HomepageComponent, canActivate: [authGuard] },
      { path: 'appointments', component: AppointmentsComponent, canActivate: [authGuard] },
      { path: 'signin', component: SigninComponent }
    ]),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
}).catch(err => console.error(err));
