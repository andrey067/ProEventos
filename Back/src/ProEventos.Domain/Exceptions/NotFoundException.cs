namespace ProEventos.Domain.Exceptions
{
    public sealed class NotFoundException : AppException
    {
        public NotFoundException(string operation, string message)
            : base(AppLayer.Persistence, operation, message)
        {
        }

        public NotFoundException(AppLayer layer, string operation, string message)
            : base(layer, operation, message)
        {
        }
    }
}
