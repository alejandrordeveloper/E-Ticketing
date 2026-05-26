import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let authController: AuthController;

  const httpServiceMock = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    }).compile();

    authController = module.get(AuthController);
    httpServiceMock.post.mockReset();
    process.env.AUTH_SERVICE_URL = 'http://localhost:8000';
  });

  it('forwards registration payloads to auth-service', async () => {
    const payload = { username: 'testuser', email: 'test@email.com', password: 'testpassword123' };
    const createdUser = { id: 1, username: 'testuser', email: 'test@email.com' };
    httpServiceMock.post.mockReturnValue(of({ data: createdUser }));

    await expect(authController.register(payload)).resolves.toEqual(createdUser);
    expect(httpServiceMock.post).toHaveBeenCalledWith('http://localhost:8000/register/', payload);
  });

  it('forwards login payloads to auth-service', async () => {
    const payload = { email: 'test@email.com', password: 'testpassword123' };
    const tokens = { access: 'token', refresh: 'refresh' };
    httpServiceMock.post.mockReturnValue(of({ data: tokens }));

    await expect(authController.login(payload)).resolves.toEqual(tokens);
    expect(httpServiceMock.post).toHaveBeenCalledWith('http://localhost:8000/login/', payload);
  });
});