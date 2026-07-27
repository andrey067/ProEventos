using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace ProEventos.Services.Dtos
{
    public class UserRegisterDto
    {
        [Required]
        public string Nome { get; set; }

        [Required]
        public string UserName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MinLength(1)]
        public string Password { get; set; }
    }

    public class UserRegisterPalestranteDto
    {
        [Required]
        public string Nome { get; set; }

        [Required]
        public string UserName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MinLength(1)]
        public string Password { get; set; }

        public string MiniCurriculo { get; set; }
        public string Telefone { get; set; }
        public string ImagemURL { get; set; }
    }

    public class UserLoginDto
    {
        [Required]
        public string UserName { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class UserUpdateDto
    {
        public string Nome { get; set; }
        public string UserName { get; set; }

        [EmailAddress]
        public string Email { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; }

        [Required]
        [MinLength(1)]
        public string NewPassword { get; set; }
    }

    public class RefreshTokenRequestDto
    {
        [Required]
        public string RefreshToken { get; set; }
    }

    public class UserDto
    {
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Nome { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public double ExpiresIn { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Nome { get; set; }
        public IList<string> Roles { get; set; }
        public int? PalestranteId { get; set; }
    }
}
