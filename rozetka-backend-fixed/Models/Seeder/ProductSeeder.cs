using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RozetkaApi.Data;
using rozetkabackend.Data.Entities.Catalog;

namespace rozetkabackend.Seeder;

public class ProductSeeder
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly ILogger<ProductSeeder> _logger;

    public ProductSeeder(AppDbContext db, IWebHostEnvironment env, IConfiguration config, ILogger<ProductSeeder> logger)
    {
        _db = db; _env = env; _config = config; _logger = logger;
    }

    public async Task SeedAsync(int targetCount)
    {
        // Категорії — потрібні для зв'язку
        var categories = _db.Categories.Where(c => !c.IsDeleted).ToList();
        if (categories.Count == 0)
        {
            var fallback = new CategoryEntity { Name = "Загальна", Slug = "zagalna" };
            _db.Categories.Add(fallback);
            await _db.SaveChangesAsync();
            categories = new() { fallback };
        }

        // Де лежать фото: беремо з Program.cs → ImagesDir
        var dirName = _config["ImagesDir"] ?? "images";
        var path1 = Path.Combine(_env.ContentRootPath, dirName);
        var path2 = _env.WebRootPath is null ? null : Path.Combine(_env.WebRootPath, dirName);
        var imagesDir = new[] { path1, path2 }.FirstOrDefault(p => !string.IsNullOrEmpty(p) && Directory.Exists(p!));
        if (imagesDir == null) throw new DirectoryNotFoundException($"Не знайдено папку зображень: {dirName}");

        var imageFiles = Directory.GetFiles(imagesDir)
            .Where(p => new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" }.Contains(Path.GetExtension(p).ToLower()))
            .Select(Path.GetFileName)
            .ToList();
        if (imageFiles.Count == 0) throw new InvalidOperationException($"У {imagesDir} немає зображень");

        var rnd = new Random();
        var have = _db.Products.Count(p => !p.IsDeleted);
        var need = Math.Max(0, targetCount - have);
        if (need == 0) return;

        for (int i = 0; i < need; i++)
        {
            var cat = categories[i % categories.Count];
            var idx = have + i + 1;
            var name = $"{cat.Name} #{idx}";
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
            var photosCount = rnd.Next(1, Math.Min(4, imageFiles.Count));
            foreach (var fileName in imageFiles.OrderBy(_ => rnd.Next()).Take(photosCount))
            {
                _db.ProductImages.Add(new ProductImageEntity
                {
                    ProductId = p.Id,
                    Name = fileName!, // фрот показує як /{ImagesDir}/{Name}
                    Priority = pr++
                });
            }

            await _db.SaveChangesAsync();
        }
    }

    private static string Slugify(string input)
    {
        string t = input
            .Replace("є", "ie").Replace("ї", "i").Replace("і", "i").Replace("ґ", "g")
            .Replace("Є", "ie").Replace("Ї", "i").Replace("І", "i").Replace("Ґ", "g");
        t = System.Text.RegularExpressions.Regex.Replace(t, @"[^A-Za-z0-9]+", "-").Trim('-');
        return System.Text.RegularExpressions.Regex.Replace(t.ToLower(), "-{2,}", "-");
    }
}
