using BreachApi.Models;
using HandlebarsDotNet;
using PuppeteerSharp;
using LoggingTimings;

namespace BreachApi.Services;

public class PdfService : IPdfService
{
    private readonly ILogger<PdfService> _logger;
    private readonly string _templatePath;

    public PdfService(ILogger<PdfService> logger, IWebHostEnvironment environment)
    {
        _logger = logger;
        _templatePath = Path.Combine(environment.ContentRootPath, "Templates", "breach-report.hbs");
    }

    public async Task<byte[]> GeneratePdfAsync(IEnumerable<BreachDto> breaches)
    {
        using var timer = _logger.Time("PDF Generation for {Count} breaches", breaches.Count());
        
        try
        {
            _logger.LogInformation("Generating PDF for {Count} breaches", breaches.Count());

            string template;
            using (var templateTimer = _logger.Time("Template loading"))
            {
                template = await GetTemplateAsync();
            }
            
            string html;
            using (var htmlTimer = _logger.Time("HTML generation from template"))
            {
                html = GenerateHtml(template, breaches);
            }
            
            byte[] pdf;
            using (var pdfTimer = _logger.Time("PDF generation from HTML"))
            {
                pdf = await GeneratePdfFromHtmlAsync(html);
            }

            _logger.LogInformation("Successfully generated PDF of {Size} bytes", pdf.Length);
            
            return pdf;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF");
            throw new InvalidOperationException("Failed to generate PDF report", ex);
        }
    }

    private async Task<string> GetTemplateAsync()
    {
        if (!File.Exists(_templatePath))
        {
            return GetDefaultTemplate();
        }

        return await File.ReadAllTextAsync(_templatePath);
    }

    private string GenerateHtml(string template, IEnumerable<BreachDto> breaches)
    {
        var handlebars = Handlebars.Create();
        var compiledTemplate = handlebars.Compile(template);

        var data = new
        {
            Title = "Data Breach Report",
            GeneratedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC"),
            TotalBreaches = breaches.Count(),
            Breaches = breaches.Select(b => new
            {
                b.Name,
                b.Title,
                b.Domain,
                BreachDate = b.BreachDate.ToString("yyyy-MM-dd"),
                AddedDate = b.AddedDate.ToString("yyyy-MM-dd"),
                PwnCount = b.PwnCount.ToString("N0"),
                b.Description,
                DataClasses = string.Join(", ", b.DataClasses),
                b.IsVerified,
                b.IsFabricated,
                b.IsSensitive
            })
        };

        return compiledTemplate(data);
    }

    private async Task<byte[]> GeneratePdfFromHtmlAsync(string html)
    {
        using (var browserSetupTimer = _logger.Time("Browser setup and download"))
        {
            await new BrowserFetcher().DownloadAsync();
        }
        
        using (var browserTimer = _logger.Time("Browser launch and PDF generation"))
        {
            await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox" }
            });

            await using var page = await browser.NewPageAsync();
            
            using (var contentTimer = _logger.Time("Page content loading"))
            {
                await page.SetContentAsync(html);
            }
            
            byte[] pdfBytes;
            using (var pdfRenderTimer = _logger.Time("PDF rendering"))
            {
                pdfBytes = await page.PdfDataAsync(new PdfOptions
                {
                    Format = PuppeteerSharp.Media.PaperFormat.A4,
                    PrintBackground = true,
                    MarginOptions = new PuppeteerSharp.Media.MarginOptions
                    {
                        Top = "20px",
                        Bottom = "20px",
                        Left = "20px",
                        Right = "20px"
                    }
                });
            }

            return pdfBytes;
        }
    }

    private static string GetDefaultTemplate()
    {
        return @"
<!DOCTYPE html>
<html>
<head>
    <title>{{Title}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .summary {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }
        .breach {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .breach-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .breach-info {
            margin-bottom: 10px;
        }
        .breach-description {
            margin-top: 10px;
            font-style: italic;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            margin: 2px;
            font-size: 12px;
            border-radius: 3px;
        }
        .verified { background-color: #d4edda; color: #155724; }
        .fabricated { background-color: #f8d7da; color: #721c24; }
        .sensitive { background-color: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>{{Title}}</h1>
        <p>Generated: {{GeneratedAt}}</p>
    </div>
    
    <div class='summary'>
        <h2>Summary</h2>
        <p>Total Breaches: {{TotalBreaches}}</p>
    </div>
    
    {{#each Breaches}}
    <div class='breach'>
        <div class='breach-title'>{{Title}}</div>
        <div class='breach-info'>
            <strong>Domain:</strong> {{Domain}}<br>
            <strong>Breach Date:</strong> {{BreachDate}}<br>
            <strong>Affected Accounts:</strong> {{PwnCount}}<br>
            <strong>Data Classes:</strong> {{DataClasses}}
        </div>
        {{#if IsVerified}}<span class='badge verified'>Verified</span>{{/if}}
        {{#if IsFabricated}}<span class='badge fabricated'>Fabricated</span>{{/if}}
        {{#if IsSensitive}}<span class='badge sensitive'>Sensitive</span>{{/if}}
        <div class='breach-description'>{{Description}}</div>
    </div>
    {{/each}}
</body>
</html>";
    }
}