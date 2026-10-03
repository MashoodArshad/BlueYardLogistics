namespace backend.Models
{
    public class Container
    {
        public string ContainerID { get; set; } = string.Empty;
        public string VesselID { get; set; } = string.Empty;
        public string CargoType { get; set; } = string.Empty;
        public int WeightKg { get; set; }
        public string PriorityLevel { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string Status { get; set; } = "Manifested";

        // Analytics & DSA Results
        public int? PriorityScore { get; set; }
        public string? RiskLevel { get; set; }
        public int? ExpectedDwellHours { get; set; }
        public string? AssignedTerminalID { get; set; }
        public string? AssignedYardSlot { get; set; }
        public string? AssignedWarehouseID { get; set; }
        public string? AssignedVehicleID { get; set; }
        public string? OptimalRoute { get; set; }
        public decimal? TotalRouteDistanceKm { get; set; }

        // Navigation Properties
        public Vessel? Vessel { get; set; }
        public Terminal? AssignedTerminal { get; set; }
        public Warehouse? AssignedWarehouse { get; set; }
        public Vehicle? AssignedVehicle { get; set; }
        public ICollection<ContainerHistory> HistoryLogs { get; set; } = new List<ContainerHistory>();
    }
}