using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TerminalsController : ControllerBase
    {
        private readonly BlueYardDbContext _context;

        public TerminalsController(BlueYardDbContext context)
        {
            _context = context;
        }

        // GET: api/terminals
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Terminal>>> GetTerminals()
        {
            var terminals = await _context.Terminals.ToListAsync();
            return Ok(terminals);
        }
    }
}