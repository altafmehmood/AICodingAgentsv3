import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred';
      
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Bad Request: Please check your input parameters.';
            break;
          case 401:
            errorMessage = 'Unauthorized: Please check your credentials.';
            break;
          case 403:
            errorMessage = 'Forbidden: You do not have permission to access this resource.';
            break;
          case 404:
            errorMessage = 'Not Found: The requested resource was not found.';
            break;
          case 429:
            errorMessage = 'Too Many Requests: Please wait before making another request.';
            break;
          case 500:
            errorMessage = 'Internal Server Error: Please try again later.';
            break;
          case 503:
            errorMessage = 'Service Unavailable: The service is temporarily unavailable.';
            break;
          default:
            errorMessage = `Server Error: ${error.status} - ${error.message}`;
        }
      }
      
      console.error('HTTP Error:', errorMessage, error);
      return throwError(() => new Error(errorMessage));
    })
  );
};