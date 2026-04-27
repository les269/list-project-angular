import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../tokens/api-base-url.token';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);

  if (
    req.url.startsWith('./assets/') ||
    req.url.startsWith('http://') ||
    req.url.startsWith('https://')
  ) {
    return next(req);
  }

  const apiReq = req.clone({ url: `${baseUrl}${req.url}` });
  return next(apiReq);
};
