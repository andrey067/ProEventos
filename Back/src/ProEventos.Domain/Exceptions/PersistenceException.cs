using System;

namespace ProEventos.Domain.Exceptions
{
    public sealed class PersistenceException : AppException
    {
        public PersistenceException(string operation, string message)
            : base(AppLayer.Persistence, operation, message)
        {
        }

        public PersistenceException(string operation, string message, Exception innerException)
            : base(AppLayer.Persistence, operation, message, innerException)
        {
        }
    }
}
