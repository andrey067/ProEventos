using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ProEventos.Domain.Exceptions;

namespace ProEventos.Api.Exceptions
{
    public sealed class AppExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<AppExceptionHandler> _logger;
        private readonly IProblemDetailsService _problemDetailsService;

        public AppExceptionHandler(
            ILogger<AppExceptionHandler> logger,
            IProblemDetailsService problemDetailsService)
        {
            _logger = logger;
            _problemDetailsService = problemDetailsService;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            if (exception is AppException appException)
            {
                _logger.LogWarning(appException,
                    "AppException layer={Layer} operation={Operation}",
                    appException.Layer,
                    appException.Operation);

                httpContext.Response.StatusCode = appException switch
                {
                    NotFoundException => StatusCodes.Status404NotFound,
                    ConflictException => StatusCodes.Status409Conflict,
                    _ => StatusCodes.Status500InternalServerError
                };

                return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
                {
                    HttpContext = httpContext,
                    Exception = appException,
                    ProblemDetails =
                    {
                        Title = appException.GetType().Name,
                        Detail = appException.Message,
                        Status = httpContext.Response.StatusCode,
                        Extensions =
                        {
                            ["layer"] = appException.Layer.ToString(),
                            ["operation"] = appException.Operation,
                            ["code"] = appException.Operation
                        }
                    }
                });
            }

            _logger.LogError(exception, "Unhandled exception");
            httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

            return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                Exception = exception,
                ProblemDetails =
                {
                    Title = "An unexpected error occurred.",
                    Detail = exception.Message,
                    Status = StatusCodes.Status500InternalServerError
                }
            });
        }
    }
}
