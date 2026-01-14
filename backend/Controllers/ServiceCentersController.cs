using FleetManagement.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;

namespace FleetManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ServiceCentersController : ControllerBase
    {
        private readonly IFleetRepository _repo;
        public ServiceCentersController(IFleetRepository repo) => _repo = repo;

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var items = await _repo.GetServiceCentersAsync();
            return Ok(items);
        }
    }
}
