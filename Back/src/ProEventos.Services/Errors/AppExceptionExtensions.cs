using ErrorOr;
using ProEventos.Domain.Exceptions;

namespace ProEventos.Services.Errors
{
    public static class AppExceptionExtensions
    {
        public static Error ToError(this AppException ex)
        {
            return ex switch
            {
                NotFoundException => Error.NotFound(code: ex.Operation, description: ex.Message),
                ConflictException => Error.Conflict(code: ex.Operation, description: ex.Message),
                PersistenceException => Error.Failure(code: ex.Operation, description: ex.Message),
                _ => Error.Failure(code: ex.Operation, description: ex.Message)
            };
        }
    }
}
