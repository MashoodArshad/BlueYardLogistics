using backend.Models;

namespace backend.Algorithms
{
    public class WarehouseSelector
    {
        public static Warehouse? SelectWarehouse(Container container, List<Warehouse> warehouses)
        {
            Warehouse? bestWarehouse = null;
            int maxScore = -1;

            foreach (var wh in warehouses)
            {
                if (wh.CurrentLoad >= wh.Capacity)
                    continue;

                int score = 0;

                // Match Cargo Type to Warehouse Specialization
                if (container.CargoType == "Medicine" && wh.Type == "Pharma")
                    score += 60;
                else if ((container.CargoType == "Clothing" || container.CargoType == "Stationery") && wh.Type == "General Goods")
                    score += 60;
                else if ((container.CargoType == "Toys" || container.CargoType == "Electronics") && wh.Type == "Retail/Toys")
                    score += 60;
                else if (wh.Type == "General Goods")
                    score += 20;

                // Location matching bonus
                if (wh.Location.Contains(container.Destination, StringComparison.OrdinalIgnoreCase))
                    score += 30;

                if (score > maxScore)
                {
                    maxScore = score;
                    bestWarehouse = wh;
                }
            }

            return bestWarehouse;
        }
    }
}