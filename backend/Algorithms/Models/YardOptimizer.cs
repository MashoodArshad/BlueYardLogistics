using backend.Algorithms.Models;
using backend.Models;

namespace backend.Algorithms
{
    public class YardOptimizer
    {
        /// <summary>
        /// Represents the yard as a 2D matrix [Row, Column] and assigns the best available slot.
        /// High-priority containers are placed in Row 1 (near the exit gate) for quick dispatch.
        /// </summary>
        public static YardSlotResult? AssignSlot(Container container, List<YardSlot> terminalSlots)
        {
            // Filter unallocated / empty slots
            var emptySlots = terminalSlots.Where(s => !s.IsOccupied).ToList();

            if (emptySlots.Count == 0)
                return null;

            // Strategy:
            // - If High Priority: Prefer Row 1 (front row nearest to gate)
            // - If Low/Normal Priority: Prefer Row 2 (back row storage)
            YardSlot? chosenSlot = null;

            if (container.PriorityLevel == "High" || (container.PriorityScore ?? 0) >= 80)
            {
                chosenSlot = emptySlots.OrderBy(s => s.SlotRow).ThenBy(s => s.SlotColumn).FirstOrDefault();
            }
            else
            {
                chosenSlot = emptySlots.OrderByDescending(s => s.SlotRow).ThenBy(s => s.SlotColumn).FirstOrDefault();
            }

            if (chosenSlot == null)
                chosenSlot = emptySlots.First();

            return new YardSlotResult
            {
                SlotID = chosenSlot.SlotID,
                Row = chosenSlot.SlotRow,
                Column = chosenSlot.SlotColumn,
                TerminalID = chosenSlot.TerminalID,
                Reason = $"Assigned slot {chosenSlot.SlotID} [Row {chosenSlot.SlotRow}, Col {chosenSlot.SlotColumn}] based on priority {container.PriorityLevel}."
            };
        }
    }
}