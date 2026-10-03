namespace backend.Models
{
    public class Vessel
    {
        public string VesselID { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public DateTime ArrivalTime { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Arrived";

        // Navigation property
        public ICollection<Container> Containers { get; set; } = new List<Container>();
    }
}