import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CoreProxyService {
  constructor(private readonly httpService: HttpService) {}

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await firstValueFrom(this.httpService.get<T>(url, config));
    return response.data;
  }

  async post<T>(url: string, body: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await firstValueFrom(this.httpService.post<T>(url, body, config));
    return response.data;
  }
}