import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrlFromHost } from './api-base';

describe('api base resolution', () => {
  it('uses the configured URL when present', () => {
    expect(resolveApiBaseUrlFromHost('main.mywayclass.pages.dev', 'https://api.example.com/')).toBe('https://api.example.com');
  });

  it('uses the local api on localhost', () => {
    expect(resolveApiBaseUrlFromHost('localhost')).toBe('http://127.0.0.1:8787');
  });

  it('uses production api on pages deployments', () => {
    expect(resolveApiBaseUrlFromHost('main.mywayclass.pages.dev')).toBe('https://myway-class-api-production.ggg9905.workers.dev');
  });

  it('uses staging api for staging subdomains', () => {
    expect(resolveApiBaseUrlFromHost('staging.mywayclass.pages.dev')).toBe('https://myway-class-api.ggg9905.workers.dev');
  });
});
