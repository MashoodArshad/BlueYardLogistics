namespace backend.Models
{
    public class WarehouseCommunication
    {
        public int MessageID { get; set; }
        public string WarehouseID { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public string Priority { get; set; } = "Normal";
        public string Message { get; set; } = string.Empty;
        public string Direction { get; set; } = "WH_TO_PORT";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsResolved { get; set; } = false;

        public Warehouse? Warehouse { get; set; }
    }
}