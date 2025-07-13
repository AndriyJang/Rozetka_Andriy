using Microsoft.EntityFrameworkCore;
using RozetkaApi.Models;

namespace RozetkaApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options) {}

        public DbSet<User> Users { get; set; }
    }
}