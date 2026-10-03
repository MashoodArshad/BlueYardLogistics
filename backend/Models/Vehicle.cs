namespace backend.Models
{
    public class Vehicle
    {
        public string VehicleID { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Reefer Truck, Flatbed Truck, etc.
        public int CapacityKg { get; set; }
        public string Status { get; set; } = "Available"; // Available, In-Transit, Maintenance
        public string CurrentLocation { get; set; } = string.Empty;
    }
}