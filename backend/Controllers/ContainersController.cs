using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;
using backend.Algorithms;
using System.Text.Json;
using System.Text;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContainersController : ControllerBase
    {
        private readonly BlueYardDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        public ContainersController(BlueYardDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        // GET: api/containers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Container>>> GetAllContainers()
        {
            var containers = await _context.Containers
                .Include(c => c.AssignedTerminal)
                .Include(c => c.AssignedWarehouse)
                .Include(c => c.AssignedVehicle)
                .ToListAsync();
            return Ok(containers);
        }

        // GET: api/containers/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Container>> GetContainerById(string id)
        {
            var container = await _context.Containers
                .Include(c => c.AssignedTerminal)
                .Include(c => c.AssignedWarehouse)
                .Include(c => c.AssignedVehicle)
                .Include(c => c.HistoryLogs)
                .FirstOrDefaultAsync(c => c.ContainerID == id);

            if (container == null)
                return NotFound(new { message = $"Container '{id}' not found." });

            return Ok(container);
        }

        // POST: api/containers/{id}/analyze (Integrates Python FastAPI Service)
        [HttpPost("{id}/analyze")]
        public async Task<IActionResult> AnalyzeContainer(string id)
        {
            var container = await _context.Containers.FindAsync(id);
            if (container == null) return NotFound(new { message = "Container not found" });

            // 1. Prepare payload for Python Service
            var payload = new
            {
                container_id = container.ContainerID,
                cargo_type = container.CargoType,
                weight_kg = container.WeightKg,
                priority_level = container.PriorityLevel,
                destination = container.Destination
            };

            // 2. Call Python FastAPI Microservice via HTTP
            var client = _httpClientFactory.CreateClient("PythonService");
            var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            try
            {
                var response = await client.PostAsync("/analyze", jsonContent);
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new { message = "Python Analytics Service failed to process container." });
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<PythonAnalysisDto>(responseBody);

                if (result != null)
                {
                    container.PriorityScore = result.PriorityScore;
                    container.RiskLevel = result.RiskLevel;
                    container.ExpectedDwellHours = result.ExpectedDwellHours;
                    container.Status = "Analyzed";

                    // Log History
                    _context.ContainerHistory.Add(new ContainerHistory
                    {
                        ContainerID = container.ContainerID,
                        Status = "Analyzed",
                        Location = "Port Inspection Bay",
                        Timestamp = DateTime.UtcNow,
                        Remarks = result.Explanation
                    });

                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Container analyzed successfully by Python AI engine.", data = container });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Could not connect to Python service on port 8000: {ex.Message}" });
            }

            return BadRequest(new { message = "Failed to deserialize analytics response." });
        }

        // POST: api/containers/{id}/assign-terminal (Integrates C# DSA TerminalScorer)
        [HttpPost("{id}/assign-terminal")]
        public async Task<IActionResult> AssignTerminal(string id)
        {
            var container = await _context.Containers.FindAsync(id);
            if (container == null) return NotFound(new { message = "Container not found" });

            var terminals = await _context.Terminals.ToListAsync();
            var bestTerminal = TerminalScorer.SelectBestTerminal(container, terminals);

            if (bestTerminal == null)
                return BadRequest(new { message = "No terminal available with sufficient capacity." });

            container.AssignedTerminalID = bestTerminal.TerminalID;
            bestTerminal.CurrentLoad += 1;
            container.Status = "TerminalAssigned";

            _context.ContainerHistory.Add(new ContainerHistory
            {
                ContainerID = container.ContainerID,
                Status = "TerminalAssigned",
                Location = $"Terminal {bestTerminal.Name} ({bestTerminal.TerminalID})",
                Timestamp = DateTime.UtcNow,
                Remarks = $"Assigned to {bestTerminal.Name} based on cargo compatibility ({container.CargoType}) and terminal load capacity."
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Terminal {bestTerminal.TerminalID} assigned.", container });
        }

        // POST: api/containers/{id}/optimize-yard (Integrates C# DSA YardOptimizer 2D Grid)
        [HttpPost("{id}/optimize-yard")]
        public async Task<IActionResult> OptimizeYardSlot(string id)
        {
            var container = await _context.Containers.FindAsync(id);
            if (container == null) return NotFound(new { message = "Container not found" });

            if (string.IsNullOrEmpty(container.AssignedTerminalID))
                return BadRequest(new { message = "Container must be assigned to a terminal first." });

            var slots = await _context.YardSlots
                .Where(s => s.TerminalID == container.AssignedTerminalID)
                .ToListAsync();

            var slotResult = YardOptimizer.AssignSlot(container, slots);
            if (slotResult == null)
                return BadRequest(new { message = "No empty yard slots available in the assigned terminal." });

            var dbSlot = slots.First(s => s.SlotID == slotResult.SlotID);
            dbSlot.IsOccupied = true;
            dbSlot.ContainerID = container.ContainerID;

            container.AssignedYardSlot = slotResult.SlotID;
            container.Status = "InYard";

            _context.ContainerHistory.Add(new ContainerHistory
            {
                ContainerID = container.ContainerID,
                Status = "InYard",
                Location = $"Yard Slot {slotResult.SlotID}",
                Timestamp = DateTime.UtcNow,
                Remarks = slotResult.Reason
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Yard Slot {slotResult.SlotID} assigned successfully.", slot = slotResult, container });
        }

        // POST: api/containers/{id}/assign-warehouse (Integrates C# DSA WarehouseSelector)
        [HttpPost("{id}/assign-warehouse")]
        public async Task<IActionResult> AssignWarehouse(string id)
        {
            var container = await _context.Containers.FindAsync(id);
            if (container == null) return NotFound(new { message = "Container not found" });

            var warehouses = await _context.Warehouses.ToListAsync();
            var bestWarehouse = WarehouseSelector.SelectWarehouse(container, warehouses);

            if (bestWarehouse == null)
                return BadRequest(new { message = "No suitable warehouse found or warehouses are at full capacity." });

            container.AssignedWarehouseID = bestWarehouse.WarehouseID;
            bestWarehouse.CurrentLoad += 1;
            container.Status = "WarehouseAssigned";

            _context.ContainerHistory.Add(new ContainerHistory
            {
                ContainerID = container.ContainerID,
                Status = "WarehouseAssigned",
                Location = $"Destined for: {bestWarehouse.Name}",
                Timestamp = DateTime.UtcNow,
                Remarks = $"Selected {bestWarehouse.Name} ({bestWarehouse.Location}) for specialized {bestWarehouse.Type} storage."
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Warehouse {bestWarehouse.WarehouseID} matched.", container });
        }

        // POST: api/containers/{id}/assign-vehicle (Integrates C# DSA VehicleAssigner)
        [HttpPost("{id}/assign-vehicle")]
        public async Task<IActionResult> AssignVehicle(string id)
        {
            var container = await _context.Containers.FindAsync(id);
            if (container == null) return NotFound(new { message = "Container not found" });

            var vehicles = await _context.Vehicles.ToListAsync();
            var chosenVehicle = VehicleAssigner.AssignVehicle(container, vehicles);

            if (chosenVehicle == null)
                return BadRequest(new { message = "No available vehicle has sufficient payload capacity." });

            container.AssignedVehicleID = chosenVehicle.VehicleID;
            chosenVehicle.Status = "Allocated";
            container.Status = "VehicleAssigned";

            _context.ContainerHistory.Add(new ContainerHistory
            {
                ContainerID = container.ContainerID,
                Status = "VehicleAssigned",
                Location = $"Assigned Vehicle {chosenVehicle.VehicleID} ({chosenVehicle.Type})",
                Timestamp = DateTime.UtcNow,
                Remarks = $"Vehicle {chosenVehicle.VehicleID} capacity {chosenVehicle.CapacityKg}kg allocated for {container.WeightKg}kg cargo."
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Vehicle {chosenVehicle.VehicleID} allocated.", container });
        }

        // POST: api/containers/{id}/optimize-route (Integrates C# DSA Graph & Dijkstra's Algorithm)
        [HttpPost("{id}/optimize-route")]
        public async Task<IActionResult> OptimizeRoute(string id)
        {
            var container = await _context.Containers.FindAsync(id);
            if (container == null) return NotFound(new { message = "Container not found" });

            if (string.IsNullOrEmpty(container.AssignedWarehouseID))
                return BadRequest(new { message = "Assign a warehouse before computing optimal route." });

            // 1. Build Graph dynamically from Database Routes table
            var dbRoutes = await _context.Routes.ToListAsync();
            var graph = new TransportGraph();

            foreach (var r in dbRoutes)
            {
                graph.AddEdge(r.SourceNode, r.DestinationNode, r.DistanceKm, r.TravelTimeMin);
            }

            // 2. Run Dijkstra's Shortest Path Algorithm: Start = "Port", Destination = WarehouseID (e.g. "W1")
            var routeResult = DijkstraRouter.FindShortestPath(graph, "Port", container.AssignedWarehouseID);

            if (routeResult == null)
                return BadRequest(new { message = $"No navigable road route found from Port to {container.AssignedWarehouseID}." });

            container.OptimalRoute = routeResult.FormattedPath;
            container.TotalRouteDistanceKm = routeResult.TotalDistanceKm;
            container.Status = "RouteOptimized";

            _context.ContainerHistory.Add(new ContainerHistory
            {
                ContainerID = container.ContainerID,
                Status = "RouteOptimized",
                Location = "Dispatch Planning Bay",
                Timestamp = DateTime.UtcNow,
                Remarks = $"Shortest path computed: {routeResult.FormattedPath} (Total: {routeResult.TotalDistanceKm} km, ETA: {routeResult.EstimatedTravelTimeMin} mins)."
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Shortest route optimized via Dijkstra algorithm.", route = routeResult, container });
        }

        // POST: api/containers/{id}/dispatch (Dispatches container for road transport)
        [HttpPost("{id}/dispatch")]
        public async Task<IActionResult> DispatchContainer(string id)
        {
            var container = await _context.Containers.FindAsync(id);
            if (container == null) return NotFound(new { message = "Container not found" });

            if (container.Status != "RouteOptimized" && container.Status != "VehicleAssigned")
                return BadRequest(new { message = "Container is not ready for dispatch." });

            // Free the yard slot
            if (!string.IsNullOrEmpty(container.AssignedYardSlot))
            {
                var slot = await _context.YardSlots.FindAsync(container.AssignedYardSlot);
                if (slot != null)
                {
                    slot.IsOccupied = false;
                    slot.ContainerID = null;
                }
            }

            // Update Vehicle Status
            if (!string.IsNullOrEmpty(container.AssignedVehicleID))
            {
                var vehicle = await _context.Vehicles.FindAsync(container.AssignedVehicleID);
                if (vehicle != null)
                {
                    vehicle.Status = "In-Transit";
                }
            }

            container.Status = "Dispatched";

            _context.ContainerHistory.Add(new ContainerHistory
            {
                ContainerID = container.ContainerID,
                Status = "Dispatched",
                Location = "En Route on Highway",
                Timestamp = DateTime.UtcNow,
                Remarks = $"Container dispatched via Vehicle {container.AssignedVehicleID} along route {container.OptimalRoute}."
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Container successfully dispatched.", container });
        }

        // POST: api/containers/{id}/auto-process (One-Click Full Workflow Pipeline)
        [HttpPost("{id}/auto-process")]
        public async Task<IActionResult> AutoProcessContainer(string id)
        {
            var analyzeResult = await AnalyzeContainer(id);
            if (analyzeResult is not OkObjectResult) return analyzeResult;

            var terminalResult = await AssignTerminal(id);
            if (terminalResult is not OkObjectResult) return terminalResult;

            var yardResult = await OptimizeYardSlot(id);
            if (yardResult is not OkObjectResult) return yardResult;

            var whResult = await AssignWarehouse(id);
            if (whResult is not OkObjectResult) return whResult;

            var vehicleResult = await AssignVehicle(id);
            if (vehicleResult is not OkObjectResult) return vehicleResult;

            var routeResult = await OptimizeRoute(id);
            if (routeResult is not OkObjectResult) return routeResult;

            var dispatchResult = await DispatchContainer(id);
            if (dispatchResult is not OkObjectResult) return dispatchResult;

            var finalContainer = await _context.Containers
                .Include(c => c.HistoryLogs)
                .FirstOrDefaultAsync(c => c.ContainerID == id);

            return Ok(new { message = "Container full operational lifecycle successfully automated!", data = finalContainer });
        }
    }
}