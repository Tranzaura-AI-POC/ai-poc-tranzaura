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
                // Try migrations first (preferred for SQL Server with migration files)
                if (context.Database.GetPendingMigrations().Any())
                {
                    context.Database.Migrate();
                }
                else
                {
                    // If no migrations exist, ensure database is created (for SQLite dev scenarios)
                    context.Database.EnsureCreated();
                }
            }
            catch (Exception ex)
            {
                // If migrations attempt to create objects that already exist (for
                // example when the DB schema was created outside of EF migrations),
                // ignore those specific errors and continue. Otherwise, rethrow.
                var msg = ex.Message ?? string.Empty;
                if (ex is Microsoft.Data.SqlClient.SqlException sqlEx)
                {
                    if (sqlEx.Number == 2714)
                        return; // object already exists, skip migration
                }

                if (msg.Contains("There is already an object named") || msg.Contains("CREATE TABLE"))
                {
                    return;
                }

                throw;
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

            // Ensure ServiceAppointments table exists (for environments without migrations)
            try
            {
                var conn = context.Database.GetDbConnection();
                conn.Open();
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = @"IF OBJECT_ID(N'[dbo].[ServiceAppointments]', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ServiceAppointments](
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [AssetTypeId] INT NOT NULL,
        [ServiceCenterId] INT NOT NULL,
        [AppointmentDate] DATETIME2 NOT NULL,
        [AssetYear] INT NULL,
        [AssetMake] NVARCHAR(200) NULL,
        [Notes] NVARCHAR(MAX) NOT NULL
    )
END";
                    cmd.ExecuteNonQuery();
                }
                conn.Close();
            }
            catch
            {
                // If raw SQL execution isn't supported by the provider or fails,
                // ignore and allow EF Migrations to handle schema management.
            }

            context.SaveChanges();
        }
    }
}





























