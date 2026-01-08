using FleetManagement.Data;
using FleetManagement.Middlewares;
using FleetManagement.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

// Configure DB
if (builder.Environment.IsDevelopment())
{
    // Use in-memory DB for local development to avoid needing a full SQL Server instance
    builder.Services.AddDbContext<FleetDbContext>(options => options.UseInMemoryDatabase("DevFleetDb"));
}
else
{
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
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalDev",
        policy => policy.WithOrigins("http://127.0.0.1:4200", "http://localhost:4200").AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// Seed DB
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

app.UseMiddleware<ExceptionMiddleware>();

app.UseCors("LocalDev");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();



























