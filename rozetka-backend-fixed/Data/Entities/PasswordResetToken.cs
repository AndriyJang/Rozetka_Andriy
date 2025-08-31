using rozetkabackend.Entities.Identity;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RozetkaApi.Data.Entities;

[Table("tblPasswordResetTokens")]
public class PasswordResetToken
{
    [Key]
    public int Id { get; set; }
    [ForeignKey(nameof(User))]
    public long UserId { get; set; }
    public string Code { get; set; } = default!; // 6 digits
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(15);
    public DateTime? UsedAt { get; set; }

    public virtual UserEntity User { get; set; }
}