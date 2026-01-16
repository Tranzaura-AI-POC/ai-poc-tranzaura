using FleetManagement.Data;
using FleetManagement.Middlewares;
using FleetManagement.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Azure.Identity;
using System.Linq;
using System.Security.Claims;
using System;
using System.IO;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using Azure.Storage.Blobs;
using Azure.Core;
using Azure;
using Azure.Identity;
using Azure.Extensions.AspNetCore.DataProtection.Blobs;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

// Optional: load secrets from Azure Key Vault when KEYVAULT_URI or KeyVault:Uri is provided.
var keyVaultUri = builder.Configuration["KeyVault:Uri"] ?? Environment.GetEnvironmentVariable("KEYVAULT_URI");
if (!string.IsNullOrEmpty(keyVaultUri))
{
    builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUri), new DefaultAzureCredential());
}

// Configure DB
// Use configured FleetDatabase connection string or environment variable.
// If none provided, fall back to the SQL Server specified by the team for user storage.
var connectionString = builder.Configuration.GetConnectionString("FleetDatabase")
                       ?? Environment.GetEnvironmentVariable("FLEET_CONNECTION_STRING");

// If running in CI (GitHub Actions) or a SQLite-style connection string is provided,
// prefer SQLite to avoid requiring a SQL Server instance on the runner.
var isCi = Environment.GetEnvironmentVariable("GITHUB_ACTIONS") == "true";
if (!string.IsNullOrEmpty(connectionString) && (connectionString.Contains("Data Source=") || connectionString.Contains("Filename=") || connectionString.Contains(".db")))
{
    builder.Services.AddDbContext<FleetDbContext>(options => options.UseSqlite(connectionString));
}
else if (isCi)
{
    // Use a file-backed SQLite DB in CI so migrations and seeding succeed.
    var ciSqlite = "Data Source=fleet_ci.db";
    builder.Services.AddDbContext<FleetDbContext>(options => options.UseSqlite(ciSqlite));
}
else
{
    // Default to SQL Server when not in CI and no explicit connection was provided.
    var defaultSql = "Server=localhost\\MSSQLSERVER01;Database=FleetDb;Trusted_Connection=True;TrustServerCertificate=True;";
    var finalConn = connectionString ?? defaultSql;
    builder.Services.AddDbContext<FleetDbContext>(options => options.UseSqlServer(finalConn));
}

// DI for repositories
builder.Services.AddScoped<IFleetRepository, FleetRepository>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Authentication (Azure AD / JWT Bearer)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // If Azure AD is configured, use the authority/audience; otherwise use local symmetric key for dev.
        var azureClient = builder.Configuration["AzureAd:ClientId"] ?? builder.Configuration["AzureAd:Audience"];
        if (!string.IsNullOrEmpty(azureClient))
        {
            var authority = builder.Configuration["AzureAd:Authority"] ??
                            ($"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}");
            options.Authority = authority;
            options.Audience = azureClient;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    RoleClaimType = ClaimTypes.Role
                };
            // Ensure role claims from different claim types are available under ClaimTypes.Role
            options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
            {
                OnTokenValidated = ctx =>
                {
                    var id = ctx.Principal?.Identity as ClaimsIdentity;
                    if (id != null)
                    {
                        var roleClaims = ctx.Principal.Claims.Where(c => c.Type == "roles" || c.Type == "role" || c.Type == ClaimTypes.Role).ToList();
                        foreach (var rc in roleClaims)
                        {
                            if (!id.HasClaim(ClaimTypes.Role, rc.Value))
                            {
                                id.AddClaim(new Claim(ClaimTypes.Role, rc.Value));
                            }
                        }
                    }
                    return System.Threading.Tasks.Task.CompletedTask;
                }
            };
        }
        else
        {
            // Local symmetric key
            // Ensure a sufficiently large fallback key for HMAC-SHA256 (>= 256 bits) when no configuration provided.
            var key = builder.Configuration["LocalJwt:Key"] ?? Environment.GetEnvironmentVariable("LOCAL_JWT_KEY") ?? "dev-local-key-change-me-please-change-this-default-to-a-secure-value-01234567";
            var issuer = builder.Configuration["LocalJwt:Issuer"] ?? "fleet-local";
            var audience = builder.Configuration["LocalJwt:Audience"] ?? "fleet-local-audience";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(key)),
                RoleClaimType = ClaimTypes.Role
            };
            // Mirror role claims into ClaimTypes.Role for consistent role checks
            options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
            {
                OnTokenValidated = ctx =>
                {
                    var id = ctx.Principal?.Identity as ClaimsIdentity;
                    if (id != null)
                    {
                        var roleClaims = ctx.Principal.Claims.Where(c => c.Type == "roles" || c.Type == "role" || c.Type == ClaimTypes.Role).ToList();
                        foreach (var rc in roleClaims)
                        {
                            if (!id.HasClaim(ClaimTypes.Role, rc.Value))
                            {
                                id.AddClaim(new Claim(ClaimTypes.Role, rc.Value));
                            }
                        }
                    }
                    return System.Threading.Tasks.Task.CompletedTask;
                }
            };
        }
    });
builder.Services.AddAuthorization();
// DataProtection key storage: prefer Azure Blob Storage when configured, fall back to local filesystem.
var dpBlobContainerUri = builder.Configuration["DataProtection:BlobContainerUri"];
var dpBlobConn = builder.Configuration["DataProtection:BlobStorage:ConnectionString"];
var dpBlobContainerName = builder.Configuration["DataProtection:BlobStorage:ContainerName"];

if (!string.IsNullOrEmpty(dpBlobContainerUri))
{
    try
    {
        var containerClient = new BlobContainerClient(new Uri(dpBlobContainerUri), new DefaultAzureCredential());
        containerClient.CreateIfNotExists();
        // NOTE: Some Azure DataProtection extensions have differing overloads depending on package versions.
        // To avoid build-time mismatches in local/dev environments, persist keys to the local filesystem when
        // a BlobContainerClient cannot be used with the available library overloads. This preserves local
        // developer experience while avoiding runtime dependency on Azure SDK overload signatures.
        var dpPath = builder.Configuration["DataProtectionPath"] ?? Environment.GetEnvironmentVariable("DATA_PROTECTION_PATH");
        if (string.IsNullOrEmpty(dpPath))
        {
            dpPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "FleetManagement", "DataProtection-Keys");
        }
        Directory.CreateDirectory(dpPath);
        builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(dpPath)).SetApplicationName("FleetManagement");
    }
    catch (Exception ex)
    {
        // If Blob persistence fails (missing permissions, network), fallback to file system and log.
        Console.WriteLine($"Warning: Failed to configure DataProtection Azure Blob persistence: {ex.Message}. Falling back to file system.");
        var dpPath = builder.Configuration["DataProtectionPath"] ?? Environment.GetEnvironmentVariable("DATA_PROTECTION_PATH");
        if (string.IsNullOrEmpty(dpPath))
        {
            dpPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "FleetManagement", "DataProtection-Keys");
        }
        Directory.CreateDirectory(dpPath);
        builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(dpPath)).SetApplicationName("FleetManagement");
    }
}
else if (!string.IsNullOrEmpty(dpBlobConn) && !string.IsNullOrEmpty(dpBlobContainerName))
{
    try
    {
        var containerClient = new BlobContainerClient(dpBlobConn, dpBlobContainerName);
        containerClient.CreateIfNotExists();
        // Use local file system persistence for DataProtection keys in local/dev environments
        var dpPath = builder.Configuration["DataProtectionPath"] ?? Environment.GetEnvironmentVariable("DATA_PROTECTION_PATH");
        if (string.IsNullOrEmpty(dpPath))
        {
            dpPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "FleetManagement", "DataProtection-Keys");
        }
        Directory.CreateDirectory(dpPath);
        builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(dpPath)).SetApplicationName("FleetManagement");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: Failed to configure DataProtection Azure Blob persistence: {ex.Message}. Falling back to file system.");
        var dpPath = builder.Configuration["DataProtectionPath"] ?? Environment.GetEnvironmentVariable("DATA_PROTECTION_PATH");
        if (string.IsNullOrEmpty(dpPath))
        {
            dpPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "FleetManagement", "DataProtection-Keys");
        }
        Directory.CreateDirectory(dpPath);
        builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(dpPath)).SetApplicationName("FleetManagement");
    }
}
else
{
    // Persist DataProtection keys to disk (configurable path)
    var dpPath = builder.Configuration["DataProtectionPath"] ?? Environment.GetEnvironmentVariable("DATA_PROTECTION_PATH");
    if (string.IsNullOrEmpty(dpPath))
    {
        dpPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "FleetManagement", "DataProtection-Keys");
    }
    Directory.CreateDirectory(dpPath);
    builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(dpPath)).SetApplicationName("FleetManagement");
}

// Optional rate limiter registration (enabled via RATE_LIMIT_ENABLED=true)
var _rateLimitEnabledEnv = builder.Configuration["RateLimitEnabled"] ?? Environment.GetEnvironmentVariable("RATE_LIMIT_ENABLED");
var _rateLimitEnabled = !string.IsNullOrEmpty(_rateLimitEnabledEnv) && bool.TryParse(_rateLimitEnabledEnv, out var _rlOn) && _rlOn;
if (_rateLimitEnabled)
{
    builder.Services.AddRateLimiter(options =>
    {
        options.AddPolicy("global", context => RateLimitPartition.GetFixedWindowLimiter("global", _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        }));
    });
}
// Enable CORS for local frontend (http://127.0.0.1:4200)
// CORS: provide a strict production-origin policy via FRONTEND_ORIGIN env var or configuration.
builder.Services.AddCors(options =>
{
    var prodOrigin = builder.Configuration["FrontendOrigin"] ?? Environment.GetEnvironmentVariable("FRONTEND_ORIGIN");

    options.AddPolicy("Production", policy =>
    {
        if (!string.IsNullOrEmpty(prodOrigin))
        {
            // Restrict allowed methods in production and allow any headers from the trusted origin
            policy.WithOrigins(prodOrigin)
                  .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                  .AllowAnyHeader();
        }
        else
        {
            // If no production origin configured, avoid open CORS in non-dev environments.
            policy.WithOrigins("http://127.0.0.1:4200", "http://localhost:4200")
                  .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                  .AllowAnyHeader();
        }
    });

    options.AddPolicy("LocalDev",
        policy => policy.WithOrigins("http://127.0.0.1:4200", "http://localhost:4200").AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// Ensure the database schema is created/migrated and seed data is applied.
// Only perform automatic migrations/seeding in development or CI. Avoid
// applying schema changes automatically in production unless explicitly
// enabled via APPLY_MIGRATIONS=true.
var applyMigrations = Environment.GetEnvironmentVariable("APPLY_MIGRATIONS") == "true";
if (app.Environment.IsDevelopment() || isCi || applyMigrations)
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            SeedData.Initialize(services);
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred seeding the DB.");
        }
    }
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<FleetManagement.Middlewares.SecurityHeadersMiddleware>();

if (app.Environment.IsProduction())
{
    // Prefer an explicit FRONTEND_ORIGIN in production for strict CORS.
    var prodOrigin = builder.Configuration["FrontendOrigin"] ?? Environment.GetEnvironmentVariable("FRONTEND_ORIGIN");
    if (string.IsNullOrEmpty(prodOrigin))
    {
        // Fall back to local development origins for ease of local testing,
        // but log a warning so operators are aware this is not strictly locked down.
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("FRONTEND_ORIGIN not set in production; falling back to LocalDev CORS for local testing.");
        app.UseCors("LocalDev");
    }
    else
    {
        // Enforce HSTS and HTTPS in production when a production origin is configured.
        app.UseHsts();
        app.UseHttpsRedirection();
        app.UseCors("Production");
    }
}
else
{
    // Enable local development CORS and developer tools when not in production.
    app.UseCors("LocalDev");
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
}
// Apply optional rate limiting before authentication and controllers
if (_rateLimitEnabled)
{
    app.UseRateLimiter();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();



























