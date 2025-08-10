using System;

namespace RozetkaApi.Data.Entities
{
    public class PasswordResetToken
    {
        public int Id { get; set; }
        public long UserId { get; set; }
        public string Code { get; set; } = default!; // 6 digits
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
    }
}