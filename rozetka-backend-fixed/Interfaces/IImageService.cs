using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace rozetkabackend.Interfaces;

public interface IImageService
{
    Task<string> SaveImageFromUrlAsync(string url, CancellationToken ct = default);
    Task<string> SaveImageAsync(IFormFile file, CancellationToken ct = default);
    Task DeleteImageAsync(string fileName);
    Task<List<string>> SaveProductImagesAsync(IEnumerable<IFormFile> files, CancellationToken ct = default);
    Task<string?> SaveCategoryImageAsync(IFormFile? file, CancellationToken ct = default);
    void RemoveProductImageSet(string fileName);
    void RemoveCategoryImage(string? fileName);
}
