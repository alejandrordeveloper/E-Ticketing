import { StructuredLogger } from './structured-logger';

describe('Events StructuredLogger', () => {
  const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

  afterEach(() => {
    stdoutSpy.mockClear();
    stderrSpy.mockClear();
  });

  afterAll(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('writes info logs', () => {
    new StructuredLogger('events-service').log('ready', 'Bootstrap');
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('writes error logs', () => {
    new StructuredLogger('events-service').error(new Error('boom'), 'trace', 'Bootstrap');
    expect(stderrSpy).toHaveBeenCalled();
  });
});