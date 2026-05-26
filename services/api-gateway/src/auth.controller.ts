import { HttpService } from '@nestjs/axios';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly httpService: HttpService) {}

    @ApiOperation({ summary: 'Register a new user through the auth service' })
    @ApiBody({ type: RegisterDto })
    @ApiCreatedResponse({ description: 'User registered successfully' })
    @Post('register')
    async register(@Body() body: RegisterDto) {
        const response = await firstValueFrom(
            this.httpService.post(`${process.env.AUTH_SERVICE_URL}/register/`, body),
        );
        return response.data;
    }

    @ApiOperation({ summary: 'Authenticate a user and obtain JWT tokens' })
    @ApiBody({ type: LoginDto })
    @ApiCreatedResponse({ description: 'JWT access and refresh tokens returned' })
    @Post('login')
    async login(@Body() body: LoginDto) {
        const response = await firstValueFrom(
            this.httpService.post(`${process.env.AUTH_SERVICE_URL}/login/`, body),
        );
        return response.data;
    }
}
