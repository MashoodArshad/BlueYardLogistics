namespace backend.Models
{
    public class WarehouseStock
    {
        public int StockID { get; set; }
        public string WarehouseID { get; set; } = string.Empty;
        public string CargoType { get; set; } = string.Empty;
        public int CurrentUnits { get; set; }
        public int MinimumRequired { get; set; }
        public int MaximumCapacity { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        public Warehouse? Warehouse { get; set; }
    }
}