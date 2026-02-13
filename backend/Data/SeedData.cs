using FleetManagement.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagement.Data
{
    public static class SeedData
    {
        public static void Initialize(IServiceProvider services)
        {
            // Only perform seeding when explicitly enabled for Development or CI,
            // or when the ENABLE_SEEDING environment variable is set to "true".
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            var isCi = Environment.GetEnvironmentVariable("GITHUB_ACTIONS") == "true";
            var enableSeeding = env == "Development" || isCi || Environment.GetEnvironmentVariable("ENABLE_SEEDING") == "true";

            // Migrations may still run depending on how Program.cs invokes Initialize.
            // We will only perform data seeding (inserting rows) when enableSeeding is true.
            using var scope = services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<FleetDbContext>();
            try
            {
                var appliedMigrations = context.Database.GetAppliedMigrations();
                var pendingMigrations = context.Database.GetPendingMigrations();
                
                // If there are any migrations (applied or pending), use Migrate()
                if (appliedMigrations.Any() || pendingMigrations.Any())
                {
                    context.Database.Migrate();
                }
                else
                {
                    // No migrations exist - use EnsureCreated for SQLite dev scenarios
                    context.Database.EnsureCreated();
                }
            }
            catch (Exception ex)
            {
                // If database already exists with schema created outside migrations, continue
                var msg = ex.Message ?? string.Empty;
                if (ex is Microsoft.Data.SqlClient.SqlException sqlEx)
                {
                    if (sqlEx.Number == 2714)
                        return; // object already exists, skip
                }
                if (msg.Contains("There is already an object named") || msg.Contains("already exists"))
                {
                    // Schema exists, continue to seeding
                }
                else
                {
                    throw;
                }
            }

            // Ensure Users table exists for environments where DB was created partially.
            try
            {
                context.Database.ExecuteSqlRaw(@"
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Users](
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Username] NVARCHAR(200) NOT NULL,
        [PasswordHash] NVARCHAR(MAX) NOT NULL,
        [Role] NVARCHAR(100) NULL
    );
END");
            }
            catch
            {
                // ignore creation failures here; seeding will attempt and surface errors
            }

            if (enableSeeding)
            {
                var _madeChanges = false;
                if (!context.AssetTypes.Any())
                {
                    context.AssetTypes.AddRange(new AssetType { Name = "Truck" },
                                               new AssetType { Name = "Van" },
                                               new AssetType { Name = "Sedan" },
                                               new AssetType { Name = "SUV" },
                                               new AssetType { Name = "Other" });
                    _madeChanges = true;
                }

                if (!context.ServiceCenters.Any())
                {
                    context.ServiceCenters.AddRange(
                        new ServiceCenter { Name = "Central Service", Address = "100 Main St", City = "Springfield", State = "CA", Zip = "90001" },
                        new ServiceCenter { Name = "Northside Service", Address = "55 North Rd", City = "Shelbyville", State = "CA", Zip = "90002" },
                        new ServiceCenter { Name = "Eastfield Garage", Address = "200 East Ave", City = "Ogden", State = "CA", Zip = "90003" }
                    );
                    _madeChanges = true;
                }

                // If we added lookups, persist them before creating appointments so their IDs are available.
                if (_madeChanges)
                {
                    context.SaveChanges();
                }

                // Seed a few example appointments so the UI shows data on first-run.
                if (!context.ServiceAppointments.Any())
                {
                    // Use existing AssetType and ServiceCenter IDs (assumes the lookup seeds above or pre-existing data)
                    var now = DateTime.UtcNow;
                    // pick some likely IDs; if lookups were just created above they will have IDs starting at 1
                    context.ServiceAppointments.AddRange(
                        new ServiceAppointment { AssetTypeId = 1, ServiceCenterId = 1, AppointmentDate = now.AddDays(3), AssetMake = "Ford", AssetYear = 2018, Notes = "Routine maintenance and oil change." },
                        new ServiceAppointment { AssetTypeId = 2, ServiceCenterId = 2, AppointmentDate = now.AddDays(7), AssetMake = "Mercedes", AssetYear = 2020, Notes = "Brake inspection." },
                        new ServiceAppointment { AssetTypeId = 3, ServiceCenterId = 1, AppointmentDate = now.AddDays(10), AssetMake = "Toyota", AssetYear = 2016, Notes = "Transmission check — customer reports slipping." },
                        new ServiceAppointment { AssetTypeId = 4, ServiceCenterId = 3, AppointmentDate = now.AddDays(14), AssetMake = "Honda", AssetYear = 2019, Notes = "Scheduled recall repair." }
                    );
                }

                // Seed a local admin user for development/testing if no users exist.
                if (context.Users == null)
                {
                    // If Users DbSet is not available for some reason, skip seeding users.
                }
                else
                {
                    try
                    {
                        if (!context.Users.Any())
                        {
                            // Default admin credentials: username 'admin', password 'Password123!'.
                            // Change this in production and/or remove the seeded account.
                            var pwHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
                            context.Users.Add(new FleetManagement.Models.User { Username = "admin", PasswordHash = pwHash, Role = "Admin" });
                        }
                    }
                    catch (Exception ex)
                    {
                        // If the Users table does not exist, create it directly and then seed.
                        var msg = ex.Message ?? string.Empty;
                        if (msg.Contains("Invalid object name 'Users'") || msg.Contains("doesn't exist") || msg.Contains("Invalid object name"))
                        {
                            try
                            {
                                // Create a minimal Users table compatible with the User model.
                                context.Database.ExecuteSqlRaw(@"
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Users](
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Username] NVARCHAR(200) NOT NULL,
        [PasswordHash] NVARCHAR(MAX) NOT NULL,
        [Role] NVARCHAR(100) NULL
    );
END");

                                var pwHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
                                context.Users.Add(new FleetManagement.Models.User { Username = "admin", PasswordHash = pwHash, Role = "Admin" });
                            }
                            catch (Exception inner)
                            {
                                // If even creation fails, surface the original error.
                                throw new Exception($"Failed to create Users table: {inner.Message}", inner);
                            }
                        }
                        else
                        {
                            throw;
                        }
                    }
                }

                context.SaveChanges();
            }
        }
    }
}





























