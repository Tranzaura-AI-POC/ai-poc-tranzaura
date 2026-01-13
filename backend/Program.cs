using FleetManagement.Data;
using FleetManagement.Middlewares;
using FleetManagement.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

// Configure DB
// Prefer an explicitly configured FleetDatabase connection string (or FLEET_CONNECTION_STRING env var)
// so the app can connect to an existing SQL Server instance even in Development.
var configuredConnection = builder.Configuration.GetConnectionString("FleetDatabase") ??
                          Environment.GetEnvironmentVariable("FLEET_CONNECTION_STRING");

if (!string.IsNullOrEmpty(configuredConnection))
{
    builder.Services.AddDbContext<FleetDbContext>(options => options.UseSqlServer(configuredConnection));
}
else if (builder.Environment.IsDevelopment())
{
    // No configured SQL connection for local dev — use a file-backed SQLite DB
    // so data persists across restarts during development.
    var sqliteConnection = "Data Source=fleet.db";
    builder.Services.AddDbContext<FleetDbContext>(options => options.UseSqlite(sqliteConnection));
}
else
{
    // Production / non-development fallback: attempt local SQL Server instance by default.
    var connectionString = builder.Configuration.GetConnectionString("FleetDatabase") ??
                           Environment.GetEnvironmentVariable("FLEET_CONNECTION_STRING") ??
                           "Server=localhost\\MSSQLSERVER01;Database=FleetDb;Trusted_Connection=True;TrustServerCertificate=True;";
    builder.Services.AddDbContext<FleetDbContext>(options => options.UseSqlServer(connectionString));
}

// DI for repositories
builder.Services.AddScoped<IFleetRepository, FleetRepository>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Enable CORS for local frontend (http://127.0.0.1:4200)
// CORS: provide a strict production-origin policy via FRONTEND_ORIGIN env var or configuration.
builder.Services.AddCors(options =>
{
    var prodOrigin = builder.Configuration["FrontendOrigin"] ?? Environment.GetEnvironmentVariable("FRONTEND_ORIGIN");

    options.AddPolicy("Production", policy =>
    {
        if (!string.IsNullOrEmpty(prodOrigin))
        {
            policy.WithOrigins(prodOrigin).AllowAnyHeader().AllowAnyMethod();
        }
        else
        {
            // If no production origin configured, avoid open CORS in non-dev environments.
            policy.WithOrigins("http://127.0.0.1:4200", "http://localhost:4200").AllowAnyHeader().AllowAnyMethod();
        }
    });

    options.AddPolicy("LocalDev",
        policy => policy.WithOrigins("http://127.0.0.1:4200", "http://localhost:4200").AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// Seed DB for in-memory or when explicitly requested.
// If a configured SQL connection is provided, assume the database already
// exists and contains data; skip the seeding/migration step to avoid
// attempting schema changes against a production DB at startup.
var skipSeeding = !string.IsNullOrEmpty(configuredConnection);
if (!skipSeeding)
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
    // Enforce HSTS and HTTPS in production.
    app.UseHsts();
    app.UseHttpsRedirection();
    app.UseCors("Production");
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
app.MapControllers();
app.Run();



























