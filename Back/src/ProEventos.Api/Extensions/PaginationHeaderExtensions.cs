using System.Text.Json;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using ProEventos.Services.Dtos;

namespace ProEventos.Api.Extensions
{
    public static class PaginationHeaderExtensions
    {
        public const string HeaderName = "Pagination";

        private static readonly JsonSerializerOptions HeaderJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public static IResult ToPagedHttpResult<T>(this ErrorOr<PageResultDto<T>> result)
        {
            if (result.IsError)
                return result.ToHttpResult();

            return new PagedJsonResult<T>(result.Value);
        }

        public static string SerializeMeta<T>(PageResultDto<T> page)
        {
            var meta = new PaginationMeta
            {
                CurrentPage = page.Page,
                ItemsPerPage = page.PageSize,
                TotalItems = page.TotalCount,
                TotalPages = page.TotalPages
            };
            return JsonSerializer.Serialize(meta, HeaderJsonOptions);
        }

        private sealed class PaginationMeta
        {
            public int CurrentPage { get; set; }
            public int ItemsPerPage { get; set; }
            public int TotalItems { get; set; }
            public int TotalPages { get; set; }
        }

        private sealed class PagedJsonResult<T> : IResult
        {
            private readonly PageResultDto<T> _page;

            public PagedJsonResult(PageResultDto<T> page) => _page = page;

            public async Task ExecuteAsync(HttpContext httpContext)
            {
                httpContext.Response.Headers[HeaderName] = SerializeMeta(_page);
                httpContext.Response.StatusCode = StatusCodes.Status200OK;
                await httpContext.Response.WriteAsJsonAsync(_page.Items ?? new List<T>());
            }
        }
    }
}
