import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiConfig, ApiConfigPK } from '../model';
import { concatMap, EMPTY, from, Observable } from 'rxjs';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { isBlank, isNull, replaceValue } from '../../../shared/util/helper';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  constructor(
    private readonly http: HttpClient,
    private snackbarService: SnackbarService
  ) {}
  getAll(): Observable<ApiConfig[]> {
    return this.http.get<ApiConfig[]>('/api-config/all');
  }
  update(req: Partial<ApiConfig>): Observable<void> {
    return this.http.post<void>('/api-config/update', req);
  }
  delete(req: Partial<ApiConfig>): Observable<void> {
    return this.http.post<void>('/api-config/delete', req);
  }
  getListById(req: Partial<ApiConfigPK[]>): Observable<ApiConfig[]> {
    return this.http.post<ApiConfig[]>('/api-config/all/id', req);
  }
  getById(req: Partial<ApiConfigPK>): Observable<ApiConfig> {
    return this.http.post<ApiConfig>('/api-config/id', req);
  }

  callSingleApi(apiConfig: ApiConfig, data: any) {
    if (isNull(apiConfig)) {
      this.snackbarService.openByI18N('msg.apiConfigEmtpy');
      return;
    }
    this.getById(apiConfig).subscribe(res => {
      if (isNull(res)) {
        this.snackbarService.openByI18N('msg.apiConfigError');
        return;
      }
      this.callByConfig([res], data);
    });
  }

  private callByConfig(list: ApiConfig[], data: any) {
    from(list)
      .pipe(
        concatMap((x, i) => {
          let obs: Observable<Object> = EMPTY;
          let url = replaceValue(x.endpointUrl, data);
          switch (x.httpMethod) {
            case 'get':
              obs = this.http.get(url);
              break;
            case 'post':
              obs = this.http.post(
                url,
                JSON.parse(
                  replaceValue(x.requestBody, data).replace(/\\/g, '\\\\')
                )
              );
              break;
            case 'delete':
              obs = this.http.delete(url);
              break;
            case 'put':
              obs = this.http.put(
                url,
                JSON.parse(
                  replaceValue(x.requestBody, data).replace(/\\/g, '\\\\')
                )
              );
              break;
          }
          return obs;
        })
      )
      .subscribe(x => {
        this.snackbarService.openSnackBar(
          list
            .map(x => x.successMessage)
            .filter(Boolean)
            .join('\n')
        );
      });
  }
}
