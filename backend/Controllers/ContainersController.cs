using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContainersController : ControllerBase
    {
        private readonly BlueYardDbContext _context;

        public ContainersController(BlueYardDbContext context)
        {
            _context = context;
        }

        // GET: api/containers
        // Returns all containers in the yard/vessel
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Container>>> GetAllContainers()
        {
            var containers = await _context.Containers.ToListAsync();
            return Ok(containers);
        }

        // GET: api/containers/C001
        // Returns a single container with its complete history timeline
        [HttpGet("{id}")]
        public async Task<ActionResult<Container>> GetContainerById(string id)
        {
            var container = await _context.Containers
                .Include(c => c.HistoryLogs)
                .FirstOrDefaultAsync(c => c.ContainerID == id);

            if (container == null)
            {
                return NotFound(new { message = $"Container with ID '{id}' not found." });
            }

            return Ok(container);
        }

        // POST: api/containers
        // Registers/Manifests a new container from a vessel
        [HttpPost]
        public async Task<ActionResult<Container>> CreateContainer([FromBody] Container container)
        {
            if (container == null || string.IsNullOrEmpty(container.ContainerID))
            {
                return BadRequest(new { message = "Container data is invalid." });
            }

            // 1. Check if vessel exists
            var vesselExists = await _context.Vessels.AnyAsync(v => v.VesselID == container.VesselID);
            if (!vesselExists)
            {
                return BadRequest(new { message = $"Vessel with ID '{container.VesselID}' does not exist." });
            }

            // 2. Check if container already exists
            var existing = await _context.Containers.FindAsync(container.ContainerID);
            if (existing != null)
            {
                return Conflict(new { message = $"Container '{container.ContainerID}' is already manifested." });
            }

            // 3. Set default state
            container.Status = "Manifested";

            _context.Containers.Add(container);

            // 4. Create initial history record
            var history = new ContainerHistory
            {
                ContainerID = container.ContainerID,
                Status = "Manifested",
                Location = "MV Ocean Star",
                Timestamp = DateTime.UtcNow,
                Remarks = "Container registered in vessel cargo manifest."
            };
            _context.ContainerHistory.Add(history);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetContainerById), new { id = container.ContainerID }, container);
        }
    }
}