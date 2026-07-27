namespace ProEventos.Domain.Exceptions
{
    public sealed class ConflictException : AppException
    {
        public ConflictException(string operation, string message)
            : base(AppLayer.Persistence, operation, message)
        {
        }

        public ConflictException(AppLayer layer, string operation, string message)
            : base(layer, operation, message)
        {
        }
    }
}
