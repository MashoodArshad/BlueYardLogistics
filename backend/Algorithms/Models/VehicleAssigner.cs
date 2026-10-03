using backend.Models;

namespace backend.Algorithms
{
    public class VehicleAssigner
    {
        /// <summary>
        /// Greedy first-fit capacity matching algorithm.
        /// Selects the smallest available vehicle that safely holds the container's weight.
        /// </summary>
        public static Vehicle? AssignVehicle(Container container, List<Vehicle> vehicles)
        {
            var availableVehicles = vehicles
                .Where(v => v.Status == "Available" && v.CapacityKg >= container.WeightKg)
                .OrderBy(v => v.CapacityKg) // Choose best-fit to minimize wasted capacity
                .ToList();

            if (availableVehicles.Count == 0)
                return null;

            // Specialized vehicle match: Medicine requires Reefer Truck
            if (container.CargoType == "Medicine" || container.CargoType == "Food")
            {
                var reefer = availableVehicles.FirstOrDefault(v => v.Type == "Reefer Truck");
                if (reefer != null) return reefer;
            }

            return availableVehicles.First();
        }
    }
}