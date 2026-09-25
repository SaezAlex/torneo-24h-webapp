import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeEs, 'es');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    {provide: LOCALE_ID, useValue: 'es' },
    provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "torneo-24h-castro", appId: "1:3411430392:web:11974cc65e444f906c240d", databaseURL: "https://torneo-24h-castro-default-rtdb.europe-west1.firebasedatabase.app", storageBucket: "torneo-24h-castro.firebasestorage.app", apiKey: "AIzaSyD3_WuZmBKjxP43A7Wny-M4Hiptq_t108s", authDomain: "torneo-24h-castro.firebaseapp.com", messagingSenderId: "3411430392"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())
  ]
};
