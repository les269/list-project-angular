import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiRequestConfig, CallApiRequest, CallApiResponse } from '../model';

@Service()
export class ApiRequestConfigService {
  private readonly http = inject(HttpClient);
  private readonly prefix = '/api-config';

  getAll(): Observable<ApiRequestConfig[]> {
    return this.http.get<ApiRequestConfig[]>(`${this.prefix}/all`);
  }

  exist(apiId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.prefix}/exist`, {
      params: { apiId },
    });
  }

  update({ apiId, description, config }: ApiRequestConfig): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, {
      apiId,
      description,
      config,
    });
  }

  delete(request: ApiRequestConfig): Observable<void> {
    return this.http.post<void>(`${this.prefix}/delete`, request);
  }

  callApi(request: CallApiRequest): Observable<HttpResponse<CallApiResponse>> {
    return this.http.post<CallApiResponse>(
      `${this.prefix}/singalCallApi`,
      request,
      {
        observe: 'response',
      }
    );
  }
}
