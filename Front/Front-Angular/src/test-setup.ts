import '@angular/compiler';
import 'zone.js';
import 'zone.js/testing';
import { importProvidersFrom } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from 'ngx-spinner';

const storage = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  },
  configurable: true,
});

beforeEach(() => {
  storage.clear();
});

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

const configureTestingModule = TestBed.configureTestingModule.bind(TestBed);
TestBed.configureTestingModule = (moduleDef) =>
  configureTestingModule({
    ...moduleDef,
    providers: [
      ...(moduleDef.providers ?? []),
      provideAnimations(),
      importProvidersFrom(NgxSpinnerModule.forRoot()),
    ],
  });
