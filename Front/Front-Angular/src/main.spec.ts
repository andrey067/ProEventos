import { describe, it, expect, vi } from 'vitest';

const bootstrapMock = vi.fn(() => Promise.resolve());

vi.mock('@angular/platform-browser', () => ({
  bootstrapApplication: bootstrapMock,
}));

vi.mock('./app/app.config', () => ({
  appConfig: { providers: [] },
}));

vi.mock('./app/app', () => ({
  App: class App {},
}));

describe('main.ts', () => {
  it('bootstraps the application', async () => {
    await import('./main');

    expect(bootstrapMock).toHaveBeenCalled();
  });
});
