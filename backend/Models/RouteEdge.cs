namespace backend.Models
{
    public class RouteEdge
    {
        public int RouteID { get; set; }
        public string SourceNode { get; set; } = string.Empty;
        public string DestinationNode { get; set; } = string.Empty;
        public decimal DistanceKm { get; set; }
        public int TravelTimeMin { get; set; }
    }
}