using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data.Entities;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Entities.Identity;

namespace RozetkaApi.Data
{
    public class AppDbContext : IdentityDbContext<UserEntity, RoleEntity, long,
        IdentityUserClaim<long>, UserRoleEntity, UserLoginEntity,
        IdentityRoleClaim<long>, IdentityUserToken<long>>
    {
        public AppDbContext(DbContextOptions options) : base(options) {}

        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        public DbSet<CategoryEntity> Categories { get; set; }
        public DbSet<ProductEntity> Products { get; set; }
        public DbSet<ProductImageEntity> ProductImages { get; set; }

        //public DbSet<User> Users { get; set; },

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<UserRoleEntity>(ur =>
            {
                ur.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(r => r.RoleId)
                    .IsRequired();

                ur.HasOne(ur => ur.User)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(u => u.UserId)
                    .IsRequired();
            });

            builder.Entity<UserLoginEntity>(b =>
            {
                b.HasOne(l => l.User)
                    .WithMany(u => u.Logins)
                    .HasForeignKey(l => l.UserId)
                    .IsRequired();
            });

            builder.Entity<CartEntity>()
                .HasKey(pi => new { pi.ProductId, pi.UserId });

        }
    }
}