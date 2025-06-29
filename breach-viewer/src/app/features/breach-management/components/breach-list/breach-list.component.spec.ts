import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { BreachListComponent } from './breach-list.component';
import { BreachApiService, PdfService } from '../../../../core/services';
import { Breach, DateRangeParams } from '../../../../core/models';

describe('BreachListComponent', () => {
  let component: BreachListComponent;
  let fixture: ComponentFixture<BreachListComponent>;
  let mockBreachApiService: jasmine.SpyObj<BreachApiService>;
  let mockPdfService: jasmine.SpyObj<PdfService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;

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

  beforeEach(async () => {
    const breachApiSpy = jasmine.createSpyObj('BreachApiService', ['getBreaches']);
    const pdfSpy = jasmine.createSpyObj('PdfService', ['downloadBreachReport']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const breakpointSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);

    await TestBed.configureTestingModule({
      imports: [BreachListComponent, NoopAnimationsModule],
      providers: [
        { provide: BreachApiService, useValue: breachApiSpy },
        { provide: PdfService, useValue: pdfSpy },
        { provide: Router, useValue: routerSpy },
        { provide: BreakpointObserver, useValue: breakpointSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BreachListComponent);
    component = fixture.componentInstance;
    mockBreachApiService = TestBed.inject(BreachApiService) as jasmine.SpyObj<BreachApiService>;
    mockPdfService = TestBed.inject(PdfService) as jasmine.SpyObj<PdfService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockBreakpointObserver = TestBed.inject(BreakpointObserver) as jasmine.SpyObj<BreakpointObserver>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load breaches on init', () => {
    mockBreachApiService.getBreaches.and.returnValue(of(mockBreaches));
    
    component.ngOnInit();
    
    component.state$.subscribe(state => {
      expect(state.breaches).toEqual(mockBreaches);
      expect(state.loading).toBeFalse();
      expect(state.error).toBeNull();
    });
  });

  it('should handle loading state', () => {
    mockBreachApiService.getBreaches.and.returnValue(of(mockBreaches));
    
    component.ngOnInit();
    
    // Test that loading state is initially true
    let isFirstEmission = true;
    component.state$.subscribe(state => {
      if (isFirstEmission) {
        expect(state.loading).toBeTrue();
        expect(state.breaches).toEqual([]);
        isFirstEmission = false;
      }
    });
  });

  it('should handle error state', () => {
    const errorMessage = 'Failed to load breaches';
    mockBreachApiService.getBreaches.and.returnValue(throwError(() => new Error(errorMessage)));
    
    component.ngOnInit();
    
    component.state$.subscribe(state => {
      if (!state.loading) {
        expect(state.error).toBe(errorMessage);
        expect(state.breaches).toEqual([]);
      }
    });
  });

  it('should navigate to breach details when onViewDetails is called', () => {
    const breach = mockBreaches[0];
    
    component.onViewDetails(breach);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/breaches', breach.name]);
  });

  it('should call PDF service when exportPdf is called', () => {
    component.exportPdf();
    
    expect(mockPdfService.downloadBreachReport).toHaveBeenCalled();
  });

  it('should filter breaches when onFilterChange is called', () => {
    const filter: DateRangeParams = { from: '2023-01-01', to: '2023-12-31' };
    mockBreachApiService.getBreaches.and.returnValue(of(mockBreaches));
    
    component.onFilterChange(filter);
    
    expect(mockBreachApiService.getBreaches).toHaveBeenCalledWith(filter);
  });

  it('should retry loading breaches when retry is called', () => {
    mockBreachApiService.getBreaches.and.returnValue(of(mockBreaches));
    
    component.retry();
    
    expect(mockBreachApiService.getBreaches).toHaveBeenCalled();
  });

  it('should track breaches by name', () => {
    const breach = mockBreaches[0];
    const result = component.trackByBreach(0, breach);
    
    expect(result).toBe(breach.name);
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
}); 