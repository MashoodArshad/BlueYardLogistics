using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VesselsController : ControllerBase
    {
        private readonly BlueYardDbContext _context;

        // Constructor — DbContext is injected automatically
        public VesselsController(BlueYardDbContext context)
        {
            _context = context;
        }

        // GET: api/vessels
        // Returns all vessels in the system
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vessel>>> GetAllVessels()
        {
            var vessels = await _context.Vessels.ToListAsync();
            return Ok(vessels);
        }

        // GET: api/vessels/V001
        // Returns a single vessel by its ID along with its containers
        [HttpGet("{id}")]
        public async Task<ActionResult<Vessel>> GetVesselById(string id)
        {
            var vessel = await _context.Vessels
                .Include(v => v.Containers)
                .FirstOrDefaultAsync(v => v.VesselID == id);

            if (vessel == null)
            {
                return NotFound(new { message = $"Vessel with ID '{id}' not found." });
            }

            return Ok(vessel);
        }

        // POST: api/vessels
        // Creates a new vessel in the system
        [HttpPost]
        public async Task<ActionResult<Vessel>> CreateVessel([FromBody] Vessel vessel)
        {
            if (vessel == null || string.IsNullOrEmpty(vessel.VesselID))
            {
                return BadRequest(new { message = "Vessel data is invalid." });
            }

            // Check if vessel already exists
            var existing = await _context.Vessels.FindAsync(vessel.VesselID);
            if (existing != null)
            {
                return Conflict(new { message = $"Vessel with ID '{vessel.VesselID}' already exists." });
            }

            _context.Vessels.Add(vessel);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVesselById), new { id = vessel.VesselID }, vessel);
        }
    }
}