using FleetManagement.Models;
using FleetManagement.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace FleetManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ServiceAppointmentsController : ControllerBase
    {
        private readonly IFleetRepository _repo;
        public ServiceAppointmentsController(IFleetRepository repo) => _repo = repo;

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            var items = await _repo.GetAppointmentsAsync();
            return Ok(items);
        }

        [HttpPost]
        [Authorize(Roles = "Editor,Admin")]
        public async Task<IActionResult> Post([FromBody] ServiceAppointment appointment)
        {
            if (appointment == null)
                return BadRequest();

            var created = await _repo.AddAppointmentAsync(appointment);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Editor,Admin")]
        public async Task<IActionResult> Put(int id, [FromBody] ServiceAppointment appointment)
        {
            if (appointment == null || id != appointment.Id)
                return BadRequest();

            var updated = await _repo.UpdateAppointmentAsync(appointment);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Editor,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _repo.DeleteAppointmentAsync(id);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
