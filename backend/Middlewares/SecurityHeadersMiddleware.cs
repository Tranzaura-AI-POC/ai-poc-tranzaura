using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace FleetManagement.Middlewares
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Basic security headers. Consider managing CSP at the edge (CDN/Front Door) for more control.
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["Referrer-Policy"] = "no-referrer";
            context.Response.Headers["Permissions-Policy"] = "geolocation=()";
            context.Response.Headers["X-XSS-Protection"] = "0";

            // A conservative CSP; adjust as needed for legitimate external resources.
            var csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'";
            context.Response.Headers["Content-Security-Policy"] = csp;

            await _next(context);
        }
    }
}
