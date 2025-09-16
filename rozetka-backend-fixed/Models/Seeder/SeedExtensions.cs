using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RozetkaApi.Data;

namespace rozetkabackend.Seeder;

public static class SeedExtensions
{
    public static async Task SeedData(this IApplicationBuilder app, int targetCount = 50)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
                                          .CreateLogger("Seeder");
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var seeder = scope.ServiceProvider.GetRequiredService<ProductSeeder>();

        var existing = await db.Products.CountAsync(p => !p.IsDeleted);
        if (existing >= targetCount)
        {
            logger.LogInformation("Seed skipped. Already have {count} products.", existing);
            return; // ← головна умова: якщо ≥ 50 — НЕ сідимо
        }

        await seeder.SeedAsync(targetCount);
        logger.LogInformation("Seed done.");
    }
}
