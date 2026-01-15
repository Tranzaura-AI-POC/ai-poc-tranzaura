using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FleetManagement.Controllers
{
    [ApiController]
    [Route("/healthz")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Health() => Ok(new { status = "Healthy" });

        [HttpGet("/readyz")]
        public IActionResult Ready()
        {
            // For now, keep readiness lightweight. Optionally add DB checks here.
            return Ok(new { status = "Ready" });
        }
    }
}
