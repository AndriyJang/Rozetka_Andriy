using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RozetkaApi.Data;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Interfaces;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System;

namespace rozetkabackend.Seeder;

public class ProductSeeder
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<ProductSeeder> _logger;
    private readonly IImageService _imageService;

    public ProductSeeder(
        AppDbContext db,
        IConfiguration config,
        ILogger<ProductSeeder> logger,
        IImageService imageService)
    {
        _db = db; _config = config; _logger = logger; _imageService = imageService;
    }

    public async Task SeedAsync(int targetCount)
    {
        var categories = _db.Categories.Where(c => !c.IsDeleted).ToList();
        if (categories.Count == 0)
        {
            var fallback = new CategoryEntity { Name = "Загальна", Slug = "zagalna" };
            _db.Categories.Add(fallback);
            await _db.SaveChangesAsync();
            categories = new() { fallback };
        }

        // Набір демо-URL'ів (можеш замінити своїми)
        var imageUrls = new[]
        {
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
            "https://images.unsplash.com/photo-1512496015851-a90fb38ba796",
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35fb",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
            "https://images.unsplash.com/photo-1526178610970-3e7a0c8d4b52",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
        };

        var rnd = new Random();
        var have = _db.Products.Count(p => !p.IsDeleted);
        var need = Math.Max(0, targetCount - have);
        if (need == 0) return;

        for (int i = 0; i < need; i++)
        {
            var cat = categories[i % categories.Count];
            var idx = have + i + 1;
            var name = $"{cat.Name} {idx}";
            var slug = Slugify(name);

            var p = new ProductEntity
            {
                Name = name,
                Slug = slug,
                Price = rnd.Next(199, 29999),
                Description = $"Опис товару «{name}». (seed)",
                CategoryId = cat.Id
            };
            _db.Products.Add(p);
            await _db.SaveChangesAsync(); // отримати Id

            short pr = 0;
            var photosCount = rnd.Next(1, 4);
            foreach (var url in imageUrls.OrderBy(_ => rnd.Next()).Take(photosCount))
            {
                try
                {
                    var baseName = await _imageService.SaveImageFromUrlAsync(url);
                    _db.ProductImages.Add(new ProductImageEntity
                    {
                        ProductId = p.Id,
                        Name = baseName,   // ← базове ім’я типу abcd.webp (без префіксів)
                        Priority = pr++
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Seed image failed: {Url}", url);
                }
            }

            await _db.SaveChangesAsync();
        }
    }

    private static string Slugify(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return "";
        var s = input
            .Normalize(NormalizationForm.FormD)
            .ToLowerInvariant();
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[^a-z0-9]+", "-").Trim('-');
        s = System.Text.RegularExpressions.Regex.Replace(s, @"-+", "-");
        return s;
    }
}
