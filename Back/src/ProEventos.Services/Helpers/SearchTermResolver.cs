namespace ProEventos.Services.Helpers
{
    public static class SearchTermResolver
    {
        /// <summary>
        /// Prefer <paramref name="q"/>; otherwise fall back to legacy Eventos <paramref name="tema"/>.
        /// </summary>
        public static string ResolveEventoTerm(string q, string tema = null)
        {
            if (!string.IsNullOrWhiteSpace(q))
                return q.Trim();
            if (!string.IsNullOrWhiteSpace(tema))
                return tema.Trim();
            return null;
        }

        /// <summary>
        /// Prefer <paramref name="q"/>; otherwise legacy <paramref name="nome"/>, then <paramref name="tema"/>.
        /// </summary>
        public static string ResolvePalestranteTerm(string q, string nome = null, string tema = null)
        {
            if (!string.IsNullOrWhiteSpace(q))
                return q.Trim();
            if (!string.IsNullOrWhiteSpace(nome))
                return nome.Trim();
            if (!string.IsNullOrWhiteSpace(tema))
                return tema.Trim();
            return null;
        }
    }
}
