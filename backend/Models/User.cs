using System.ComponentModel.DataAnnotations;

namespace FleetManagement.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        // Simple role string: e.g. "Admin", "Editor", "User"
        public string Role { get; set; } = "User";
    }
}
