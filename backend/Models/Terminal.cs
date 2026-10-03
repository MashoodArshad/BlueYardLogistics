namespace backend.Models
{
    public class Terminal
    {
        public string TerminalID { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // General Cargo, Pharma / Priority, Special Cargo
        public int Capacity { get; set; }
        public int CurrentLoad { get; set; } = 0;

        // Navigation property
        public ICollection<YardSlot> YardSlots { get; set; } = new List<YardSlot>();
    }
}