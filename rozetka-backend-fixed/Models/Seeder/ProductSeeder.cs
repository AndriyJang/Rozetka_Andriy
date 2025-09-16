using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Text;
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
        if (string.IsNullOrWhiteSpace(input)) return "";
        var map = new Dictionary<char, string>
        {
            ['є'] = "ie",
            ['ї'] = "i",
            ['і'] = "i",
            ['ґ'] = "g",
            ['Є'] = "ie",
            ['Ї'] = "i",
            ['І'] = "i",
            ['Ґ'] = "g",
            ['а'] = "a",
            ['б'] = "b",
            ['в'] = "v",
            ['г'] = "h",
            ['д'] = "d",
            ['е'] = "e",
            ['ё'] = "e",
            ['ж'] = "zh",
            ['з'] = "z",
            ['и'] = "y",
            ['й'] = "y",
            ['к'] = "k",
            ['л'] = "l",
            ['м'] = "m",
            ['н'] = "n",
            ['о'] = "o",
            ['п'] = "p",
            ['р'] = "r",
            ['с'] = "s",
            ['т'] = "t",
            ['у'] = "u",
            ['ф'] = "f",
            ['х'] = "h",
            ['ц'] = "ts",
            ['ч'] = "ch",
            ['ш'] = "sh",
            ['щ'] = "shch",
            ['ъ'] = "",
            ['ы'] = "y",
            ['ь'] = "",
            ['э'] = "e",
            ['ю'] = "yu",
            ['я'] = "ya",
            ['А'] = "a",
            ['Б'] = "b",
            ['В'] = "v",
            ['Г'] = "h",
            ['Д'] = "d",
            ['Е'] = "e",
            ['Ё'] = "e",
            ['Ж'] = "zh",
            ['З'] = "z",
            ['И'] = "y",
            ['Й'] = "y",
            ['К'] = "k",
            ['Л'] = "l",
            ['М'] = "m",
            ['Н'] = "n",
            ['О'] = "o",
            ['П'] = "p",
            ['Р'] = "r",
            ['С'] = "s",
            ['Т'] = "t",
            ['У'] = "u",
            ['Ф'] = "f",
            ['Х'] = "h",
            ['Ц'] = "ts",
            ['Ч'] = "ch",
            ['Ш'] = "sh",
            ['Щ'] = "shch",
            ['Ъ'] = "",
            ['Ы'] = "y",
            ['Ь'] = "",
            ['Э'] = "e",
            ['Ю'] = "yu",
            ['Я'] = "ya"
        };

        // транслітерація
        var sb = new System.Text.StringBuilder(input.Length * 2);
        foreach (var ch in input)
            sb.Append(map.TryGetValue(ch, out var sub) ? sub : ch.ToString());

        var s = sb.ToString()
            .Normalize(NormalizationForm.FormD)
            .ToLowerInvariant();

        // лише [a-z0-9-], декілька дефісів згортаємо
        s = Regex.Replace(s, @"[^a-z0-9]+", "-").Trim('-');
        s = Regex.Replace(s, @"-+", "-");
        return s;
    }

}
