import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BreachApiService } from './breach-api.service';
import { Breach, DateRangeParams } from '../models';
import { environment } from '../../../environments/environment';

describe('BreachApiService', () => {
  let service: BreachApiService;
  let httpMock: HttpTestingController;

  const mockBreaches: Breach[] = [
    {
      name: 'test-breach',
      title: 'Test Breach',
      domain: 'test.com',
      breachDate: '2023-01-01',
      addedDate: '2023-01-02',
      modifiedDate: '2023-01-02',
      pwnCount: 1000,
      description: 'Test breach description',
      dataClasses: ['Email addresses', 'Passwords'],
      isVerified: true,
      isFabricated: false,
      isSensitive: false,
      isRetired: false,
      isSpamList: false,
      isMalware: false,
      logoPath: ''
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BreachApiService]
    });
    service = TestBed.inject(BreachApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBreaches', () => {
    it('should fetch breaches without parameters', () => {
      service.getBreaches().subscribe(breaches => {
        expect(breaches).toEqual(mockBreaches);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/breach`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockBreaches);
    });

    it('should fetch breaches with date range parameters', () => {
      const params: DateRangeParams = {
        from: '2023-01-01',
        to: '2023-12-31'
      };

      service.getBreaches(params).subscribe(breaches => {
        expect(breaches).toEqual(mockBreaches);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/breach?from=2023-01-01&to=2023-12-31`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBreaches);
    });

    it('should handle HTTP errors', () => {
      service.getBreaches().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/breach`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('downloadPdf', () => {
    it('should download PDF without parameters', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadPdf().subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/breach/pdf`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should download PDF with date range parameters', () => {
      const params: DateRangeParams = {
        from: '2023-01-01',
        to: '2023-12-31'
      };
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.downloadPdf(params).subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/breach/pdf?from=2023-01-01&to=2023-12-31`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });
}); 