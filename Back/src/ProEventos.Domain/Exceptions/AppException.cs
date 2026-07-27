using System;

namespace ProEventos.Domain.Exceptions
{
    public abstract class AppException : Exception
    {
        public AppLayer Layer { get; }
        public string Operation { get; }

        protected AppException(AppLayer layer, string operation, string message)
            : base(message)
        {
            Layer = layer;
            Operation = operation;
        }

        protected AppException(AppLayer layer, string operation, string message, Exception innerException)
            : base(message, innerException)
        {
            Layer = layer;
            Operation = operation;
        }
    }
}
