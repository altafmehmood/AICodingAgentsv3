# Architecture Design and Technical Requirements

## System Overview

The Breach Management System follows a modern full-stack architecture with clear separation of concerns, implementing defensive security practices and scalable design patterns.

## 1. High-Level Architecture

### 1.1 System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Angular 20    │    │   .NET 9.0       │    │  External APIs  │
│  Frontend SPA   │◄──►│   Web API        │◄──►│  Have I Been    │
│                 │    │                  │    │  Pwned, Claude  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Redis Cache    │             │
         │              │   Layer          │             │
         │              └──────────────────┘             │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   Browser       │                            │  Cloud Services │
│   Client        │                            │  (Azure/AWS)    │
└─────────────────┘                            └─────────────────┘
```

### 1.2 Architecture Principles
- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
- **Defensive Security**: Security-first approach with input validation, rate limiting, and error handling
- **Scalability**: Designed for horizontal scaling and high availability
- **Maintainability**: Clean code practices with comprehensive testing and documentation
- **Performance**: Caching strategies and optimization patterns throughout

## 2. Backend Architecture (.NET 9.0)

### 2.1 Technical Stack
- **Framework**: ASP.NET Core 9.0 Web API
- **Language**: C# with .NET 9.0
- **Architecture Pattern**: Clean Architecture with CQRS (MediatR)
- **HTTP Client**: Flurl.Http for external API communication
- **Caching**: Redis with StackExchange.Redis
- **PDF Generation**: PuppeteerSharp for HTML-to-PDF conversion
- **Templating**: Handlebars.Net for dynamic content generation
- **Testing**: xUnit with NSubstitute for mocking
- **Logging**: Microsoft.Extensions.Logging with structured logging
- **Monitoring**: Health checks with custom health check endpoints

### 2.2 Architectural Layers

#### 2.2.1 Presentation Layer
- **Controllers**: RESTful API endpoints
- **Middleware**: Global exception handling, rate limiting, CORS
- **Models**: DTOs for request/response serialization
- **Validation**: Input validation and sanitization

#### 2.2.2 Business Logic Layer  
- **Services**: Core business logic implementation
- **Interfaces**: Abstraction for dependency injection
- **CQRS Pattern**: Command and Query separation (MediatR)
- **Domain Models**: Business entities and value objects

#### 2.2.3 Infrastructure Layer
- **External APIs**: Integration with Have I Been Pwned and Claude AI
- **Caching**: Redis implementation for performance optimization
- **Configuration**: Azure Key Vault integration for secrets management
- **Health Checks**: Comprehensive system health monitoring

### 2.3 Security Requirements

#### 2.3.1 API Security
- **Rate Limiting**: Configurable request throttling
- **CORS Configuration**: Restricted origins and methods
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses without information disclosure

#### 2.3.2 Data Protection
- **Secrets Management**: Azure Key Vault for sensitive configuration
- **Logging Security**: No sensitive data in logs
- **Transport Security**: HTTPS enforcement
- **Dependency Security**: Regular security updates for NuGet packages

### 2.4 Performance Requirements
- **Response Time**: API responses < 2 seconds for 95th percentile
- **Throughput**: Support 1000+ concurrent requests
- **Caching**: Redis caching for external API responses (TTL: 1 hour)
- **Resource Optimization**: Memory usage < 512MB per instance

## 3. Frontend Architecture (Angular 20)

### 3.1 Technical Stack
- **Framework**: Angular 20 with standalone components
- **Language**: TypeScript 5.8+
- **UI Framework**: Angular Material 20
- **State Management**: RxJS reactive patterns
- **HTTP Client**: Angular HttpClient with interceptors
- **Testing**: Jasmine/Karma for unit testing
- **Build Tool**: Angular CLI with esbuild
- **Styling**: SCSS with responsive design principles

### 3.2 Application Structure

#### 3.2.1 Feature-Based Architecture
```
src/
├── app/
│   ├── core/                 # Singleton services and guards
│   │   ├── services/         # API services, interceptors
│   │   ├── models/           # TypeScript interfaces
│   │   └── interceptors/     # HTTP interceptors
│   ├── features/             # Feature modules
│   │   └── breach-management/
│   │       ├── components/   # Feature-specific components
│   │       └── services/     # Feature services
│   ├── shared/               # Reusable components and utilities
│   │   ├── components/       # Common UI components
│   │   └── pipes/           # Custom pipes
│   └── layout/               # Application layout components
```

#### 3.2.2 Component Architecture
- **Standalone Components**: Angular 20 standalone component pattern
- **OnPush Change Detection**: Optimized change detection strategy
- **Reactive Programming**: RxJS for state management and async operations
- **Lazy Loading**: Route-based code splitting
- **Accessibility**: WCAG 2.1 AA compliance

### 3.3 Performance Requirements
- **First Contentful Paint**: < 1.5 seconds
- **Time to Interactive**: < 3 seconds
- **Bundle Size**: Main bundle < 500KB gzipped
- **Runtime Performance**: 60fps animations and interactions
- **Memory Usage**: < 50MB heap size for typical usage

### 3.4 Responsive Design Requirements
- **Breakpoints**: Mobile (480px), Tablet (768px), Desktop (1024px+)
- **Touch Support**: Touch-friendly interactions on mobile devices
- **Progressive Enhancement**: Core functionality without JavaScript
- **Cross-Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 4. Data Architecture

### 4.1 Data Flow
```
External APIs → Backend Cache → Backend Processing → Frontend State → UI Components
```

### 4.2 Caching Strategy
- **Backend Caching**: Redis for external API responses
- **Frontend Caching**: HTTP cache headers and browser caching
- **Cache Invalidation**: Time-based TTL and manual invalidation
- **Cache Warming**: Proactive cache population for common queries

### 4.3 Data Models

#### 4.3.1 Core Entities
- **Breach**: Complete breach information from external sources
- **AiRiskSummary**: AI-generated risk analysis and recommendations
- **DateRangeParams**: Filtering parameters for data queries
- **HealthCheckResult**: System health monitoring data

#### 4.3.2 Data Transfer Objects (DTOs)
- **BreachDto**: Serialized breach data for API responses
- **BreachQueryRequest**: Request parameters for breach queries
- **BreachPdfRequest**: Parameters for PDF generation
- **AiRiskSummaryDto**: AI analysis response structure

## 5. Integration Architecture

### 5.1 External Service Integration

#### 5.1.1 Have I Been Pwned API
- **Authentication**: API key-based authentication
- **Rate Limiting**: Respect external API rate limits
- **Error Handling**: Graceful handling of API failures
- **Data Transformation**: Convert external data to internal models

#### 5.1.2 Claude AI Integration
- **Service**: AI-powered risk analysis and recommendations
- **Configuration**: Secure API key management
- **Prompt Engineering**: Optimized prompts for breach analysis
- **Response Processing**: Structured AI response parsing

### 5.2 Service Communication
- **HTTP/REST**: Primary communication protocol
- **JSON Serialization**: Standard data exchange format
- **Error Propagation**: Consistent error handling across services
- **Timeout Configuration**: Appropriate timeouts for external calls

## 6. Deployment Architecture

### 6.1 Infrastructure Requirements
- **Hosting**: Cloud-native deployment (Azure App Service recommended)
- **Database**: Redis Cache for session and application caching
- **CDN**: Content delivery network for static assets
- **Load Balancing**: Application Gateway for traffic distribution
- **SSL/TLS**: End-to-end encryption for all communications

### 6.2 Environment Configuration
- **Development**: Local development with Docker containers
- **Staging**: Production-like environment for testing
- **Production**: High-availability deployment with monitoring
- **Configuration Management**: Environment-specific settings with Azure Key Vault

### 6.3 Monitoring and Observability
- **Application Insights**: Performance and error monitoring
- **Health Checks**: Custom health check endpoints
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Performance metrics and alerting

## 7. Quality Attributes

### 7.1 Scalability
- **Horizontal Scaling**: Stateless application design
- **Caching**: Multiple caching layers for performance
- **Async Processing**: Non-blocking operations where possible
- **Resource Optimization**: Efficient memory and CPU usage

### 7.2 Reliability
- **Error Handling**: Comprehensive error handling and recovery
- **Health Monitoring**: Proactive system health checks
- **Retry Logic**: Resilient external service integration
- **Graceful Degradation**: Partial functionality during failures

### 7.3 Security
- **Defense in Depth**: Multiple security layers
- **Input Validation**: Comprehensive input sanitization
- **Secrets Management**: Secure configuration management
- **Audit Logging**: Security event logging and monitoring

### 7.4 Maintainability
- **Clean Architecture**: Clear separation of concerns
- **Testing Strategy**: Comprehensive unit and integration testing
- **Documentation**: Inline code documentation and API documentation
- **Code Quality**: Consistent coding standards and static analysis

## 8. Technology Constraints and Decisions

### 8.1 Backend Technology Decisions
- **.NET 9.0**: Latest stable version with performance improvements
- **Flurl.Http**: Preferred HTTP client for external API integration
- **MediatR**: CQRS implementation for clean architecture
- **Redis**: High-performance caching solution
- **xUnit + NSubstitute**: Testing framework combination

### 8.2 Frontend Technology Decisions
- **Angular 20**: Latest stable version with standalone components
- **Angular Material**: Consistent UI component library
- **RxJS**: Reactive programming for complex async operations
- **SCSS**: Advanced CSS preprocessing for maintainable styles
- **TypeScript**: Type safety and developer productivity

### 8.3 Integration Constraints
- **External API Limits**: Rate limiting and usage quotas
- **Data Privacy**: Compliance with data protection regulations
- **Browser Support**: Modern browser compatibility requirements
- **Performance Budgets**: Defined limits for bundle size and performance metrics