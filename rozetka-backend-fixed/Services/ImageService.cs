using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using rozetkabackend.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;            // ← додано
using System.Threading;
using System.Threading.Tasks;

namespace rozetkabackend.Services
{
    public class ImageService : IImageService
    {
        private static readonly HttpClient _http = new HttpClient(); // для завантаження з URL

        private readonly string _imagesDir;
        private readonly int[] _sizes;

        public ImageService(IConfiguration config)
        {
            _imagesDir = config.GetValue<string>("ImagesDir") ?? "images";
            _sizes = config.GetSection("ImageSizes").Get<int[]>() ?? new[] { 200, 800 };
            Directory.CreateDirectory(Path.Combine(AppContext.BaseDirectory, _imagesDir));
        }

        // ─────────────────────────────────────────────────────────────
        // ЗБЕРЕГТИ КАРТИНКУ З URL (для сидера)
        // ─────────────────────────────────────────────────────────────
        public async Task<string> SaveImageFromUrlAsync(string url, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(url)) throw new ArgumentException("Empty URL.", nameof(url));

            using var resp = await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct);
            resp.EnsureSuccessStatusCode();

            await using var stream = await resp.Content.ReadAsStreamAsync(ct);
            var baseName = $"{Guid.NewGuid():N}.webp";

            using var image = await Image.LoadAsync(stream, ct);

            // ресайзи
            foreach (var size in _sizes)
            {
                using var clone = image.Clone(ctx => ctx.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(size, size)
                }));
                var outPath = Path.Combine(AppContext.BaseDirectory, _imagesDir, $"{size}_{baseName}");
                await clone.SaveAsync(outPath, new WebpEncoder { Quality = 80 }, ct);
            }

            // оригінал
            var originalPath = Path.Combine(AppContext.BaseDirectory, _imagesDir, $"0_{baseName}");
            await image.SaveAsync(originalPath, new WebpEncoder { Quality = 90 }, ct);

            return baseName;
        }

        // ─────────────────────────────────────────────────────────────
        // ОДИН ФАЙЛ (сумісність зі старим кодом)
        // ─────────────────────────────────────────────────────────────
        public async Task<string> SaveImageAsync(IFormFile file, CancellationToken ct = default)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Empty image file.", nameof(file));

            var names = await SaveProductImagesAsync(new[] { file }, ct);
            var name = names.FirstOrDefault();
            if (string.IsNullOrWhiteSpace(name))
                throw new InvalidOperationException("Failed to save image.");
            return name;
        }

        public Task DeleteImageAsync(string fileName)
        {
            RemoveProductImageSet(fileName);
            return Task.CompletedTask;
        }

        // ─────────────────────────────────────────────────────────────
        // КІЛЬКА ФАЙЛІВ (мульти-розмірний WEBP)
        // ─────────────────────────────────────────────────────────────
        public async Task<List<string>> SaveProductImagesAsync(IEnumerable<IFormFile> files, CancellationToken ct = default)
        {
            var result = new List<string>();

            foreach (var file in files)
            {
                if (file == null || file.Length == 0) continue;

                var baseName = $"{Guid.NewGuid():N}.webp";
                using var image = await Image.LoadAsync(file.OpenReadStream(), ct);

                foreach (var size in _sizes)
                {
                    using var clone = image.Clone(ctx => ctx.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(size, size)
                    }));
                    var dest = Path.Combine(AppContext.BaseDirectory, _imagesDir, $"{size}_{baseName}");
                    await clone.SaveAsync(dest, new WebpEncoder { Quality = 80 }, ct);
                }

                var originalDest = Path.Combine(AppContext.BaseDirectory, _imagesDir, $"0_{baseName}");
                await image.SaveAsync(originalDest, new WebpEncoder { Quality = 90 }, ct);

                result.Add(baseName);
            }

            return result;
        }

        public async Task<string?> SaveCategoryImageAsync(IFormFile? file, CancellationToken ct = default)
        {
            if (file == null || file.Length == 0) return null;
            return await SaveImageAsync(file, ct);
        }

        public void RemoveProductImageSet(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName)) return;

            var folder = Path.Combine(AppContext.BaseDirectory, _imagesDir);
            if (!Directory.Exists(folder)) return;

            foreach (var path in Directory.EnumerateFiles(folder, $"*_{fileName}", SearchOption.TopDirectoryOnly))
            {
                try { File.Delete(path); } catch { /* ignore */ }
            }
        }

        public void RemoveCategoryImage(string? fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName)) return;
            RemoveProductImageSet(fileName);
        }
    }
}
