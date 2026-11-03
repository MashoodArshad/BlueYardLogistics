using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WarehousesController : ControllerBase
    {
        private readonly BlueYardDbContext _context;

        public WarehousesController(BlueYardDbContext context)
        {
            _context = context;
        }

        // GET: api/warehouses — Full warehouse list with capacity
        [HttpGet]
        public async Task<ActionResult> GetAllWarehouses()
        {
            var warehouses = await _context.Warehouses.ToListAsync();
            return Ok(warehouses);
        }

        // GET: api/warehouses/W1 — Complete warehouse details with stock + incoming + communications
        [HttpGet("{id}")]
        public async Task<ActionResult> GetWarehouseDetail(string id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return NotFound(new { message = "Warehouse not found" });

            // Stock inventory
            var stock = await _context.WarehouseStock
                .Where(s => s.WarehouseID == id)
                .ToListAsync();

            // Incoming containers (assigned to this warehouse)
            var incomingContainers = await _context.Containers
                .Where(c => c.AssignedWarehouseID == id && c.Status != "Delivered")
                .ToListAsync();

            // Communications log
            var communications = await _context.WarehouseCommunication
                .Where(c => c.WarehouseID == id)
                .OrderByDescending(c => c.Timestamp)
                .Take(20)
                .ToListAsync();

            // Capacity utilization
            var utilizationPct = warehouse.Capacity > 0 
                ? (warehouse.CurrentLoad * 100.0 / warehouse.Capacity) 
                : 0;

            return Ok(new
            {
                warehouse = warehouse,
                utilizationPercent = Math.Round(utilizationPct, 1),
                stockInventory = stock,
                incomingShipments = incomingContainers,
                communicationLog = communications,
                criticalDemands = stock.Where(s => s.CurrentUnits < s.MinimumRequired).ToList()
            });
        }

        // POST: api/warehouses/{id}/confirm-arrival/{containerId}
        [HttpPost("{id}/confirm-arrival/{containerId}")]
        public async Task<IActionResult> ConfirmArrival(string id, string containerId)
        {
            var container = await _context.Containers.FindAsync(containerId);
            if (container == null) return NotFound(new { message = "Container not found" });

            container.Status = "Delivered";

            // Log communication
            _context.WarehouseCommunication.Add(new WarehouseCommunication
            {
                WarehouseID = id,
                MessageType = "ArrivalConfirmation",
                Priority = "Normal",
                Message = $"Container {containerId} ({container.CargoType}) successfully received at warehouse. Status marked Delivered.",
                Direction = "WH_TO_PORT",
                Timestamp = DateTime.UtcNow
            });

            // Log container history
            _context.ContainerHistory.Add(new ContainerHistory
            {
                ContainerID = containerId,
                Status = "Delivered",
                Location = $"Warehouse {id}",
                Timestamp = DateTime.UtcNow,
                Remarks = $"Delivery confirmed by warehouse {id}. Container received and acknowledged."
            });

            // Update stock
            var stockItem = await _context.WarehouseStock
                .FirstOrDefaultAsync(s => s.WarehouseID == id && s.CargoType == container.CargoType);
            if (stockItem != null)
            {
                stockItem.CurrentUnits += 1;
                stockItem.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Arrival of {containerId} confirmed at warehouse {id}.", container });
        }

        // POST: api/warehouses/{id}/flag-delay/{containerId}
        [HttpPost("{id}/flag-delay/{containerId}")]
        public async Task<IActionResult> FlagDelay(string id, string containerId)
        {
            var container = await _context.Containers.FindAsync(containerId);
            if (container == null) return NotFound(new { message = "Container not found" });

            _context.WarehouseCommunication.Add(new WarehouseCommunication
            {
                WarehouseID = id,
                MessageType = "DelayWarning",
                Priority = "High",
                Message = $"Delay alert: Container {containerId} (Vehicle {container.AssignedVehicleID}) has not arrived at expected time. Investigation required.",
                Direction = "WH_TO_PORT",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Delay warning flagged for container {containerId}." });
        }
    }
}