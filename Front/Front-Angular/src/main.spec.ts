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
    vi.resetModules();
    bootstrapMock.mockResolvedValueOnce(undefined);
    await import('./main');

    expect(bootstrapMock).toHaveBeenCalled();
  });

  it('logs bootstrap errors', async () => {
    vi.resetModules();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    bootstrapMock.mockRejectedValueOnce(new Error('boot failed'));
    await import('./main');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
