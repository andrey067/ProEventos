using System.ComponentModel.DataAnnotations;

namespace ProEventos.Api.Options
{
    public sealed class CorsOptions
    {
        public const string SectionName = "Cors";

        /// <summary>Comma-separated frontend origins allowed by CORS.</summary>
        [Required]
        public string Origins { get; set; }

        public string[] GetOrigins() =>
            (Origins ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }
}
