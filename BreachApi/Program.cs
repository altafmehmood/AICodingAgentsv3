using BreachApi.Middleware;
using BreachApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

builder.Services.AddHttpClient();
builder.Services.AddScoped<IHaveIBeenPwnedService, HaveIBeenPwnedService>();
builder.Services.AddScoped<IPdfService, PdfService>();

// AI Services
builder.Services.AddMemoryCache();
builder.Services.AddStackExchangeRedisCache(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Redis") ?? 
                          builder.Configuration["Redis:ConnectionString"];
    if (!string.IsNullOrEmpty(connectionString))
    {
        options.Configuration = connectionString;
    }
});
builder.Services.AddScoped<IClaudeConfigurationService, ClaudeConfigurationService>();
builder.Services.AddScoped<IAiRiskAnalysisService, AiRiskAnalysisService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");

app.MapControllers();

app.Run();
