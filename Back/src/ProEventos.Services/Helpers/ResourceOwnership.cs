using System;

namespace ProEventos.Services.Helpers
{
    public static class ResourceOwnership
    {
        /// <summary>
        /// Owner match. Legacy resources with blank UserId are treated as owned by nobody
        /// for mutation purposes (caller must be organizer AND we still deny — blank means deny).
        /// Prefer seeding UserId; blank UserId returns false.
        /// </summary>
        public static bool IsOwner(string resourceUserId, string callerUserId)
        {
            if (string.IsNullOrWhiteSpace(callerUserId))
                return false;
            if (string.IsNullOrWhiteSpace(resourceUserId))
                return false;
            return string.Equals(resourceUserId.Trim(), callerUserId.Trim(), StringComparison.Ordinal);
        }
    }
}
