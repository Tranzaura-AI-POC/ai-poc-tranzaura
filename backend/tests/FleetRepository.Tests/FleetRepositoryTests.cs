using System;
using System.Linq;
using System.Threading.Tasks;
using FleetManagement.Data;
using FleetManagement.Models;
using FleetManagement.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FleetRepository.Tests
{
    public class FleetRepositoryTests
    {
        private static FleetDbContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<FleetDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new FleetDbContext(options);
        }

        [Fact]
        public async Task AddAppointmentAsync_AddsAndReturnsAppointment()
        {
            var ctx = CreateContext(Guid.NewGuid().ToString());
            var repo = new FleetManagement.Repositories.FleetRepository(ctx);

            var appt = new ServiceAppointment { AssetMake = "TestMake", AppointmentDate = DateTime.UtcNow.AddDays(1) };
            var added = await repo.AddAppointmentAsync(appt);

            Assert.NotNull(added);
            Assert.True(added.Id != 0 || ctx.ServiceAppointments.Any());
            var fromDb = ctx.ServiceAppointments.FirstOrDefault();
            Assert.NotNull(fromDb);
            Assert.Equal("TestMake", fromDb.AssetMake);
        }

        [Fact]
        public async Task UpdateAppointmentAsync_UpdatesExisting_ReturnsUpdated()
        {
            var ctx = CreateContext(Guid.NewGuid().ToString());
            var seed = new ServiceAppointment { AssetMake = "Before", AppointmentDate = DateTime.UtcNow };
            ctx.ServiceAppointments.Add(seed);
            await ctx.SaveChangesAsync();

            var repo = new FleetManagement.Repositories.FleetRepository(ctx);
            seed.AssetMake = "After";
            seed.AssetYear = 1999;

            var updated = await repo.UpdateAppointmentAsync(seed);

            Assert.NotNull(updated);
            Assert.Equal("After", updated.AssetMake);
            Assert.Equal(1999, updated.AssetYear);
        }

        [Fact]
        public async Task UpdateAppointmentAsync_NonExisting_ReturnsNull()
        {
            var ctx = CreateContext(Guid.NewGuid().ToString());
            var repo = new FleetManagement.Repositories.FleetRepository(ctx);
            var non = new ServiceAppointment { Id = 9999, AssetMake = "X" };
            var res = await repo.UpdateAppointmentAsync(non);
            Assert.Null(res);
        }

        [Fact]
        public async Task DeleteAppointmentAsync_RemovesAndReturnsTrue()
        {
            var ctx = CreateContext(Guid.NewGuid().ToString());
            var seed = new ServiceAppointment { AssetMake = "ToDelete", AppointmentDate = DateTime.UtcNow };
            ctx.ServiceAppointments.Add(seed);
            await ctx.SaveChangesAsync();

            var repo = new FleetManagement.Repositories.FleetRepository(ctx);
            var id = seed.Id;
            var deleted = await repo.DeleteAppointmentAsync(id);

            Assert.True(deleted);
            Assert.False(ctx.ServiceAppointments.Any(a => a.Id == id));
        }

        [Fact]
        public async Task DeleteAppointmentAsync_NonExisting_ReturnsFalse()
        {
            var ctx = CreateContext(Guid.NewGuid().ToString());
            var repo = new FleetManagement.Repositories.FleetRepository(ctx);
            var res = await repo.DeleteAppointmentAsync(12345);
            Assert.False(res);
        }

        [Fact]
        public async Task GetAppointmentsAsync_ReturnsSeededItems()
        {
            var ctx = CreateContext(Guid.NewGuid().ToString());
            ctx.ServiceAppointments.Add(new ServiceAppointment { AssetMake = "A" });
            ctx.ServiceAppointments.Add(new ServiceAppointment { AssetMake = "B" });
            await ctx.SaveChangesAsync();

            var repo = new FleetManagement.Repositories.FleetRepository(ctx);
            var list = await repo.GetAppointmentsAsync();
            Assert.NotNull(list);
            Assert.Equal(2, list.Count());
        }
    }
}
