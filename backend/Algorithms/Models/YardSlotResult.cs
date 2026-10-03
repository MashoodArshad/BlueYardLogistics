namespace backend.Algorithms.Models
{
    public class YardSlotResult
    {
        public string SlotID { get; set; } = string.Empty;
        public int Row { get; set; }
        public int Column { get; set; }
        public string TerminalID { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }
}