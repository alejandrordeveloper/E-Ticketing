import { StructuredLogger } from './structured-logger';

describe('StructuredLogger', () => {
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

  it('writes info logs to stdout', () => {
    const logger = new StructuredLogger('api-gateway');

    logger.log('hello', 'Bootstrap');

    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('"service":"api-gateway"'));
  });

  it('writes error logs to stderr', () => {
    const logger = new StructuredLogger('api-gateway');

    logger.error(new Error('boom'), 'trace', 'Bootstrap');

    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('"trace":"trace"'));
  });
});