using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Product;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace rozetkabackend.Services;

public class ProductService(IMapper mapper, AppDbContext context, IImageService imageService) : IProductService
{
    public async Task<ProductItemModel> GetById(int id)
    {
        var model = await context.Products
            .Where(x => x.Id == id && !x.IsDeleted)
            .ProjectTo<ProductItemModel>(mapper.ConfigurationProvider)
            .SingleOrDefaultAsync();

        return model!;
    }

    public async Task<List<ProductItemModel>> GetBySlug(string slug)
    {
        var model = await context.Products
            .Where(x => x.Slug == slug && !x.IsDeleted)
            .ProjectTo<ProductItemModel>(mapper.ConfigurationProvider)
            .ToListAsync();

        return model;
    }

    public async Task<List<ProductItemModel>> List()
    {
        var model = await context.Products
            .Where(x => !x.IsDeleted)
            .ProjectTo<ProductItemModel>(mapper.ConfigurationProvider)
            .ToListAsync();

        return model;
    }

    public async Task<ProductEntity> Create(ProductCreateModel model)
    {
        var entity = mapper.Map<ProductEntity>(model);
        context.Products.Add(entity);
        await context.SaveChangesAsync(); // щоб зʼявився Id

        // додавання фото (якщо є)
        if (model.ImageFiles is { Count: > 0 })
        {
            short pr = 0;
            foreach (var file in model.ImageFiles)
            {
                try
                {
                    var savedName = await imageService.SaveImageAsync(file);
                    var productImage = new ProductImageEntity
                    {
                        ProductId = entity.Id,
                        Name = savedName,
                        Priority = pr++
                    };
                    context.ProductImages.Add(productImage);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error saving PRODUCT IMAGE: " + ex.Message);
                }
            }
            await context.SaveChangesAsync();
        }

        return entity;
    }

    public async Task<ProductItemModel> Edit(ProductEditModel model)
    {
        // 1) Завантажити продукт
        var entity = await context.Products
            .Where(x => x.Id == model.Id && !x.IsDeleted)
            .SingleOrDefaultAsync();

        if (entity == null)
            throw new InvalidOperationException($"Product {model.Id} not found");

        // 2) Оновити прості поля з AutoMapper
        mapper.Map(model, entity);

        // 3) Отримати поточні зображення з БД (без трекінгу порядку з фронта)
        var currentImages = await context.ProductImages
            .Where(pi => pi.ProductId == entity.Id)
            .OrderBy(pi => pi.Priority)
            .ToListAsync();

        // 4) Розібрати CSV зі списком файлів, які залишаємо та їх порядок
        //    Якщо CSV не передали — вважаємо, що залишаємо всі поточні в їхньому порядку
        // 4) keep
        List<string> keep;
        if (!string.IsNullOrWhiteSpace(model.KeepImageNames))
        {
            keep = model.KeepImageNames
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(ToBaseName)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        else
        {
            keep = currentImages.Select(ci => ci.Name).ToList();
        }
        // 5) Видалити ті, яких немає в keep
        var toDelete = currentImages.Where(ci => !keep.Contains(ci.Name)).ToList();
        foreach (var img in toDelete)
        {
            await imageService.DeleteImageAsync(img.Name); // видаляє всі розміри
            context.ProductImages.Remove(img);
        }

        // 6) Проставити нові Priority відповідно до порядку в keep
        for (short i = 0; i < keep.Count; i++)
        {
            var hit = currentImages.FirstOrDefault(ci => ci.Name == keep[i]);
            if (hit != null)
                hit.Priority = i;
        }

        // 7) Додати нові файли в кінець
        if (model.ImageFiles is { Count: > 0 })
        {
            short start = (short)keep.Count;
            foreach (var file in model.ImageFiles)
            {
                try
                {
                    var saved = await imageService.SaveImageAsync(file);
                    var productImage = new ProductImageEntity
                    {
                        ProductId = entity.Id,
                        Name = saved,
                        Priority = start++
                    };
                    context.ProductImages.Add(productImage);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error saving PRODUCT IMAGE: " + ex.Message);
                }
            }
        }

        // 8) Зберегти зміни
        await context.SaveChangesAsync();

        // 9) Повернути оновлену проєкцію
        var item = await context.Products
            .Where(x => x.Id == model.Id && !x.IsDeleted)
            .ProjectTo<ProductItemModel>(mapper.ConfigurationProvider)
            .SingleAsync();

        return item;
    }

    public async Task Delete(long id)
    {
        var product = await context.Products
            .Where(x => x.Id == id && !x.IsDeleted)
            .FirstOrDefaultAsync();

        if (product == null)
            return;

        product.IsDeleted = true;
        await context.SaveChangesAsync();
    }
    private static string ToBaseName(string? val)
    {
        if (string.IsNullOrWhiteSpace(val)) return "";
        var v = val.Trim();
        v = v.Replace("\\", "/");
        var onlyName = System.IO.Path.GetFileName(v); // відкинути шлях
        return System.Text.RegularExpressions.Regex.Replace(onlyName, @"^\d+_", ""); // прибрати 200_
    }
}
