using FleetManagement.Repositories;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace FleetManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetTypesController : ControllerBase
    {
        private readonly IFleetRepository _repo;
        public AssetTypesController(IFleetRepository repo) => _repo = repo;

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var items = await _repo.GetAssetTypesAsync();
            return Ok(items);
        }
    }
}
