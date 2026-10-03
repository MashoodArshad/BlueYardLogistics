using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class BlueYardDbContext : DbContext
    {
        public BlueYardDbContext(DbContextOptions<BlueYardDbContext> options) : base(options)
        {
        }

        public DbSet<Vessel> Vessels { get; set; }
        public DbSet<Container> Containers { get; set; }
        public DbSet<Terminal> Terminals { get; set; }
        public DbSet<YardSlot> YardSlots { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<RouteEdge> Routes { get; set; }
        public DbSet<ContainerHistory> ContainerHistory { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Table mappings matching SQL Server definitions
            modelBuilder.Entity<Vessel>().ToTable("Vessels").HasKey(v => v.VesselID);
            modelBuilder.Entity<Terminal>().ToTable("Terminals").HasKey(t => t.TerminalID);
            modelBuilder.Entity<Warehouse>().ToTable("Warehouses").HasKey(w => w.WarehouseID);
            modelBuilder.Entity<Vehicle>().ToTable("Vehicles").HasKey(v => v.VehicleID);
            modelBuilder.Entity<RouteEdge>().ToTable("Routes").HasKey(r => r.RouteID);

            modelBuilder.Entity<Container>(entity =>
            {
                entity.ToTable("Containers").HasKey(c => c.ContainerID);
                entity.Property(c => c.TotalRouteDistanceKm).HasColumnType("decimal(6,2)");

                entity.HasOne(c => c.Vessel)
                      .WithMany(v => v.Containers)
                      .HasForeignKey(c => c.VesselID)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.AssignedTerminal)
                      .WithMany()
                      .HasForeignKey(c => c.AssignedTerminalID)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(c => c.AssignedWarehouse)
                      .WithMany()
                      .HasForeignKey(c => c.AssignedWarehouseID)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(c => c.AssignedVehicle)
                      .WithMany()
                      .HasForeignKey(c => c.AssignedVehicleID)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<YardSlot>(entity =>
            {
                entity.ToTable("YardSlots").HasKey(y => y.SlotID);

                entity.HasOne(y => y.Terminal)
                      .WithMany(t => t.YardSlots)
                      .HasForeignKey(y => y.TerminalID)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(y => y.Container)
                      .WithMany()
                      .HasForeignKey(y => y.ContainerID)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ContainerHistory>(entity =>
            {
                entity.ToTable("ContainerHistory").HasKey(h => h.HistoryID);

                entity.HasOne(h => h.Container)
                      .WithMany(c => c.HistoryLogs)
                      .HasForeignKey(h => h.ContainerID)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<RouteEdge>(entity =>
            {
                entity.Property(r => r.DistanceKm).HasColumnType("decimal(6,2)");
            });
        }
    }
}