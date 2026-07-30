using System;

namespace ProEventos.Domain.Helpers
{
    /// <summary>Curated Unsplash CDN portraits. No API key; CDN GET only.</summary>
    public static class UnsplashPortraitPicker
    {
        private static readonly string[] Portraits =
        {
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=max",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=max",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=max",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&fit=max",
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=max",
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&fit=max",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=max",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&fit=max",
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&fit=max",
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&fit=max",
        };

        private static readonly Random Random = new();

        public static string Next() => Portraits[Random.Next(Portraits.Length)];

        public static string At(int index) => Portraits[Math.Abs(index) % Portraits.Length];
    }
}
