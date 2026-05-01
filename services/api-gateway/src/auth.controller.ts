import { Controller } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { Post, Body } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

@Controller('auth')
export class AuthController {
    constructor(private readonly httpService: HttpService) {}

    // Aquí puedes agregar métodos para manejar las rutas de autenticación
    
    @Post('register')
    async register(@Body() body: any) {
        //  Envía la petición al Auth Service y espera la respuesta
        const response = await firstValueFrom(this.httpService.post(`${process.env.AUTH_SERVICE_URL}/register/`, body));
         // Devuelve el cuerpo de la respuesta del Auth Service al cliente
        return response.data;
    }

    @Post('login')
    async login(@Body() body: any) {
        // Envía la petición al Auth Service y espera la respuesta
        const response = await firstValueFrom(this.httpService.post(`${process.env.AUTH_SERVICE_URL}/login/`, body));
        // Devuelve el cuerpo de la respuesta del Auth Service al cliente
        return response.data;
    }
}
