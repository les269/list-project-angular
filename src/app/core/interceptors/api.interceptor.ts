import { HttpInterceptorFn } from '@angular/common/http';
import { api } from '../../../environments/environments';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('./assets/')) {
    return next(req);
  }
  const apiReq = req.clone({ url: `${api}${req.url}` });
  return next(apiReq);
};
