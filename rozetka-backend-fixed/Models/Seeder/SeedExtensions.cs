using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace rozetkabackend.Seeder
{
    public static class SeedExtensions
    {
        public static async Task SeedData(this IApplicationBuilder app, int targetCount = 50)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
                                              .CreateLogger("Seeder");
            var seeder = scope.ServiceProvider.GetRequiredService<ProductSeeder>();

            // Викликаємо завжди. Сам сидер додає лише нестачу до targetCount.
            await seeder.SeedAsync(targetCount);

            logger.LogInformation("Seed top-up executed (target {target}).", targetCount);
        }
    }
}
