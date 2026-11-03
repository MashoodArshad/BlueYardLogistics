using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehiclesController : ControllerBase
    {
        private readonly BlueYardDbContext _context;

        public VehiclesController(BlueYardDbContext context)
        {
            _context = context;
        }

        // GET: api/vehicles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetAllVehicles()
        {
            var vehicles = await _context.Vehicles.ToListAsync();
            return Ok(vehicles);
        }

        // GET: api/vehicles/V1
        [HttpGet("{id}")]
        public async Task<ActionResult> GetVehicleDetail(string id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null)
                return NotFound(new { message = $"Vehicle '{id}' not found." });

            // Find if any container is assigned to this vehicle
            var assignedContainer = await _context.Containers
                .FirstOrDefaultAsync(c => c.AssignedVehicleID == id);

            return Ok(new
            {
                vehicle = vehicle,
                assignedContainer = assignedContainer
            });
        }
    }
}