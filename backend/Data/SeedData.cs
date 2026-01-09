using FleetManagement.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagement.Data
{
    public static class SeedData
    {
        public static void Initialize(IServiceProvider services)
        {
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

            if (!context.AssetTypes.Any())
            {
                context.AssetTypes.AddRange(new AssetType { Name = "Truck" },
                                           new AssetType { Name = "Van" },
                                           new AssetType { Name = "Sedan" },
                                           new AssetType { Name = "SUV" },
                                           new AssetType { Name = "Other" });
            }

            if (!context.ServiceCenters.Any())
            {
                context.ServiceCenters.AddRange(
                    new ServiceCenter { Name = "Central Service", Address = "100 Main St", City = "Springfield", State = "CA", Zip = "90001" },
                    new ServiceCenter { Name = "Northside Service", Address = "55 North Rd", City = "Shelbyville", State = "CA", Zip = "90002" },
                    new ServiceCenter { Name = "Eastfield Garage", Address = "200 East Ave", City = "Ogden", State = "CA", Zip = "90003" }
                );
            }

            context.SaveChanges();
        }
    }
}





























