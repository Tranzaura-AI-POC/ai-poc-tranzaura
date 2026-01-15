using FleetManagement.Data;
using FleetManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FleetManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FleetDbContext _ctx;
        private readonly IConfiguration _config;

        public AuthController(FleetDbContext ctx, IConfiguration config)
        {
            _ctx = ctx;
            _config = config;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            if (req == null || string.IsNullOrEmpty(req.Username) || string.IsNullOrEmpty(req.Password))
                return BadRequest();

            var user = _ctx.Users?.FirstOrDefault(u => u.Username == req.Username);
            if (user == null) return Unauthorized();

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Unauthorized();

            // Issue local JWT
            var token = CreateToken(user);
            return Ok(new { token });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest req)
        {
            if (req == null || string.IsNullOrEmpty(req.Username) || string.IsNullOrEmpty(req.Password))
                return BadRequest();

            if (_ctx.Users?.Any(u => u.Username == req.Username) == true) return Conflict("User exists");

            var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            var user = new User { Username = req.Username, PasswordHash = hash, Role = req.Role ?? "User" };
            _ctx.Users?.Add(user);
            _ctx.SaveChanges();
            return CreatedAtAction(null, new { user.Id, user.Username });
        }

        private string CreateToken(User user)
        {
            // Use LocalJwt:Key (env LOCAL_JWT_KEY) for local development
            var key = _config["LocalJwt:Key"] ?? Environment.GetEnvironmentVariable("LOCAL_JWT_KEY");
            // Ensure a sufficiently large symmetric key for HMAC-SHA256 (>= 256 bits)
            if (string.IsNullOrEmpty(key)) key = "dev-local-key-change-me-please-change-this-default-to-a-secure-value-01234567";

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                // Include both the custom 'roles' claim and the standard ClaimTypes.Role
                // to ensure Role-based checks work regardless of token-validation settings.
                new Claim("roles", user.Role ?? "User"),
                new Claim(ClaimTypes.Role, user.Role ?? "User")
            };

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var creds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["LocalJwt:Issuer"] ?? "fleet-local",
                audience: _config["LocalJwt:Audience"] ?? "fleet-local-audience",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginRequest { public string? Username { get; set; } public string? Password { get; set; } }
    public class RegisterRequest { public string? Username { get; set; } public string? Password { get; set; } public string? Role { get; set; } }
}
