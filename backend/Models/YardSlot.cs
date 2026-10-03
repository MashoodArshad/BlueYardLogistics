namespace backend.Models
{
    public class YardSlot
    {
        public string SlotID { get; set; } = string.Empty;
        public string TerminalID { get; set; } = string.Empty;
        public int SlotRow { get; set; }
        public int SlotColumn { get; set; }
        public bool IsOccupied { get; set; } = false;
        public string? ContainerID { get; set; }

        // Navigation Properties
        public Terminal? Terminal { get; set; }
        public Container? Container { get; set; }
    }
}