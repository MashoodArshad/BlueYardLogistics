namespace backend.Models
{
    public class ContainerHistory
    {
        public int HistoryID { get; set; }
        public string ContainerID { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? Remarks { get; set; }

        // Navigation Property
        public Container? Container { get; set; }
    }
}