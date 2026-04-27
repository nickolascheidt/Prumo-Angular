import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const tenantId = this.authService.getCurrentTenantId();

    if (token) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`
      };
      if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
      }
      request = request.clone({ setHeaders: headers });
    }

    return next.handle(request);
  }
}
