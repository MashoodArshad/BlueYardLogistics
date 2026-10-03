using backend.Models;

namespace backend.Algorithms
{
    public class TerminalScorer
    {
        public static Terminal? SelectBestTerminal(Container container, List<Terminal> terminals)
        {
            Terminal? bestTerminal = null;
            int highestSuitability = -1;

            foreach (var terminal in terminals)
            {
                // Check if terminal has available capacity
                if (terminal.CurrentLoad >= terminal.Capacity)
                    continue;

                int score = 0;

                // 1. Cargo Compatibility Rules
                if (container.CargoType == "Medicine" || container.CargoType == "Food")
                {
                    if (terminal.Type == "Pharma / Priority") score += 50;
                    else if (terminal.Type == "General Cargo") score += 10;
                }
                else if (container.CargoType == "Electronics")
                {
                    if (terminal.Type == "Special Cargo") score += 50;
                    else if (terminal.Type == "Pharma / Priority") score += 30;
                    else score += 10;
                }
                else // Clothing, Toys, Stationery
                {
                    if (terminal.Type == "General Cargo") score += 50;
                    else score += 20;
                }

                // 2. Load Balancing Bonus (Terminals with more empty space get higher preference)
                int remainingSlots = terminal.Capacity - terminal.CurrentLoad;
                score += remainingSlots * 2;

                if (score > highestSuitability)
                {
                    highestSuitability = score;
                    bestTerminal = terminal;
                }
            }

            return bestTerminal;
        }
    }
}