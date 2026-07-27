using System;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace ProEventos.Api.Extensions
{
    public static class ErrorOrHttpResultExtensions
    {
        public static IResult ToHttpResult<T>(this ErrorOr<T> result, Func<T, IResult> onValue = null)
        {
            if (!result.IsError)
            {
                if (onValue != null)
                    return onValue(result.Value);

                if (result.Value is Success)
                    return Results.Ok(new { message = "Ok" });

                return Results.Ok(result.Value);
            }

            return ToErrorResult(result.FirstError);
        }

        public static IResult ToHttpResult(this ErrorOr<Success> result, object successBody)
        {
            if (!result.IsError)
                return Results.Ok(successBody);

            return ToErrorResult(result.FirstError);
        }

        private static IResult ToErrorResult(Error error)
        {
            var body = new
            {
                code = error.Code,
                description = error.Description,
                layer = InferLayer(error.Code)
            };

            return error.Type switch
            {
                ErrorType.NotFound => Results.NotFound(body),
                ErrorType.Validation => Results.BadRequest(body),
                ErrorType.Conflict => Results.Conflict(body),
                ErrorType.Unauthorized => Results.Json(body, statusCode: StatusCodes.Status401Unauthorized),
                ErrorType.Forbidden => Results.Json(body, statusCode: StatusCodes.Status403Forbidden),
                _ => Results.BadRequest(body)
            };
        }

        private static string InferLayer(string code)
        {
            if (string.IsNullOrEmpty(code))
                return "Service";

            if (code.StartsWith("BaseRepository.", StringComparison.Ordinal) ||
                code.Contains(".Persistence", StringComparison.Ordinal))
                return "Persistence";

            return "Service";
        }
    }
}
