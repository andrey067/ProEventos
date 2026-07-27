using Microsoft.AspNetCore.Identity;

namespace ProEventos.Domain.Entities
{
    public class User : IdentityUser
    {
        public string Nome { get; set; }
    }
}
