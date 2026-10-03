namespace backend.Algorithms.Models
{
    public class RouteResult
    {
        public List<string> PathNodes { get; set; } = new List<string>();
        public decimal TotalDistanceKm { get; set; }
        public int EstimatedTravelTimeMin { get; set; }
        public string FormattedPath => string.Join(" ➔ ", PathNodes);
    }
}