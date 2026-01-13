using FleetManagement.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagement.Data
{
    public class FleetDbContext : DbContext
    {
        public FleetDbContext(DbContextOptions<FleetDbContext> options) : base(options)
        {
        }

        public DbSet<AssetType>? AssetTypes { get; set; }
        public DbSet<ServiceCenter>? ServiceCenters { get; set; }
        public DbSet<ServiceAppointment>? ServiceAppointments { get; set; }
        public DbSet<FleetManagement.Models.User>? Users { get; set; }
    }
}
