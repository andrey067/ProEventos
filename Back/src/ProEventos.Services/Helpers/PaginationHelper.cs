using System;
using ProEventos.Services.Dtos;

namespace ProEventos.Services.Helpers
{
    public static class PaginationHelper
    {
        public static readonly int[] AllowedPageSizes = { 10, 20, 30 };
        public const int DefaultPage = 1;
        public const int DefaultPageSize = 10;

        public static (int Page, int PageSize) Normalize(int? page, int? pageSize)
        {
            var p = page ?? DefaultPage;
            if (p < 1) p = DefaultPage;

            var size = pageSize ?? DefaultPageSize;
            if (size != 10 && size != 20 && size != 30)
                size = DefaultPageSize;

            return (p, size);
        }

        public static PageResultDto<T> Build<T>(
            System.Collections.Generic.List<T> items,
            int page,
            int pageSize,
            int totalCount)
        {
            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
            var effectivePage = page;
            if (totalPages > 0 && effectivePage > totalPages)
                effectivePage = totalPages;

            return new PageResultDto<T>
            {
                Items = items ?? new System.Collections.Generic.List<T>(),
                Page = totalCount == 0 ? DefaultPage : effectivePage,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        /// <summary>
        /// If requested page is beyond last, returns clamped page so caller can re-query.
        /// </summary>
        public static int ClampPage(int page, int pageSize, int totalCount)
        {
            if (totalCount == 0) return DefaultPage;
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            if (page < 1) return DefaultPage;
            if (page > totalPages) return totalPages;
            return page;
        }
    }
}
