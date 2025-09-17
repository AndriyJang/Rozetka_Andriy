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
        // Категорії
        var categories = _db.Categories.Where(c => !c.IsDeleted).ToList();
        if (categories.Count == 0)
        {
            var fallback = new CategoryEntity { Name = "Загальна", Slug = "zagalna" };
            _db.Categories.Add(fallback);
            await _db.SaveChangesAsync();
            categories = new() { fallback };
        }

        // Генератор стабільних URLів (1600x1200). Для різноманітності — різні "seed".
        string Picsum(string seed) => $"https://picsum.photos/seed/{Uri.EscapeDataString(seed)}/1600/1200.jpg";
        string Placeholder(string seed) => $"https://placehold.co/1600x1200/png?text={Uri.EscapeDataString(seed)}";

        var tags = new[] { "laptop", "headphones", "phone", "watch", "camera", "monitor", "tv", "speaker", "ssd", "router" };

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

            foreach (var tag in tags.OrderBy(_ => rnd.Next()).Take(photosCount))
            {
                var seed = $"{tag}-{Guid.NewGuid():N}".Substring(0, 18);

                // 1-ша спроба — picsum
                var url = Picsum(seed);

                try
                {
                    var baseName = await _imageService.SaveImageFromUrlAsync(url);
                    _db.ProductImages.Add(new ProductImageEntity
                    {
                        ProductId = p.Id,
                        Name = baseName, // базове ім’я *.webp (без 200_/0_)
                        Priority = pr++
                    });
                }
                catch (Exception ex1)
                {
                    _logger.LogWarning(ex1, "Seed image failed (picsum): {Url}", url);

                    // fallback — placehold.co (завжди 200)
                    var fallbackUrl = Placeholder(seed);
                    try
                    {
                        var baseName = await _imageService.SaveImageFromUrlAsync(fallbackUrl);
                        _db.ProductImages.Add(new ProductImageEntity
                        {
                            ProductId = p.Id,
                            Name = baseName,
                            Priority = pr++
                        });
                    }
                    catch (Exception ex2)
                    {
                        _logger.LogWarning(ex2, "Seed image failed (fallback): {Url}", fallbackUrl);
                    }
                }
            }

            await _db.SaveChangesAsync();
        }
    }

    private static string Slugify(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return "";
        var s = input.Normalize(NormalizationForm.FormD).ToLowerInvariant();
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[^a-z0-9]+", "-").Trim('-');
        s = System.Text.RegularExpressions.Regex.Replace(s, @"-+", "-");
        return s;
    }
}
