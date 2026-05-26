jest.mock('@nestjs/core', () => ({
  NestFactory: { create: jest.fn() },
}));

jest.mock('@nestjs/swagger', () => ({
  ApiProperty: jest.fn(() => () => undefined),
  ApiTags: jest.fn(() => () => undefined),
  ApiOperation: jest.fn(() => () => undefined),
  ApiBody: jest.fn(() => () => undefined),
  ApiCreatedResponse: jest.fn(() => () => undefined),
  ApiOkResponse: jest.fn(() => () => undefined),
  DocumentBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  })),
  SwaggerModule: {
    createDocument: jest.fn().mockReturnValue({}),
    setup: jest.fn(),
  },
}));

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { bootstrap } from './main';

describe('events main bootstrap', () => {
  it('configures swagger and validation before listening', async () => {
    const appMock = {
      useLogger: jest.fn(),
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(appMock);

    await bootstrap();

    expect(appMock.useGlobalPipes).toHaveBeenCalled();
    expect(appMock.useGlobalFilters).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api/docs', appMock, expect.any(Object));
  });
});