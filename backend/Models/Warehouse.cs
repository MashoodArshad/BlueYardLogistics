namespace backend.Models
{
    public class Warehouse
    {
        public string WarehouseID { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Pharma, General Goods, Retail/Toys
        public int Capacity { get; set; }
        public int CurrentLoad { get; set; } = 0;
        public string Location { get; set; } = string.Empty;
    }
}