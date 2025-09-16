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

public class ProductService(IMapper mapper, AppDbContext context,
    IImageService imageService) : IProductService
{
    public async Task<ProductItemModel> GetById(int id)
    {
        var model = await context.Products
            .Where(x => x.Id == id)
            .ProjectTo<ProductItemModel>(mapper.ConfigurationProvider)
            .SingleOrDefaultAsync();

        return model;
    }

    public async Task<List<ProductItemModel>> GetBySlug(string slug)
    {
        var model = await context.Products
            .Where(x => x.Slug == slug)
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
        await context.SaveChangesAsync();

        for (short i = 0; i < model.ImageFiles!.Count; i++)
        {
            try
            {
                var productImage = new ProductImageEntity
                {
                    ProductId = entity.Id,
                    Name = await imageService.SaveImageAsync(model.ImageFiles[i]),
                    Priority = i
                };
                context.ProductImages.Add(productImage);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error Json Parse Data for PRODUCT IMAGE", ex.Message);
            }
        }
        await context.SaveChangesAsync();
        return entity;
    }

    public async Task<ProductItemModel> Edit(ProductEditModel model)
    {
        var entity = await context.Products
            .Where(x => x.Id == model.Id)
            .SingleOrDefaultAsync();

        mapper.Map(model, entity);

        var item = await context.Products
            .Where(x => x.Id == model.Id)
            .ProjectTo<ProductItemModel>(mapper.ConfigurationProvider)
            .SingleOrDefaultAsync();

        //Якщо фото немає у списку, то видаляємо його
        var imgDelete = item.ProductImages
            .Where(x => !model.ImageFiles!.Any(y => y.FileName == x.Name))
            .ToList();

        foreach (var img in imgDelete)
        {
            var productImage = await context.ProductImages
                .Where(x => x.Id == img.Id)
                .SingleOrDefaultAsync();
            if (productImage != null)
            {
                await imageService.DeleteImageAsync(productImage.Name);
                context.ProductImages.Remove(productImage);
            }
            context.SaveChanges();
        }

        short p = 0;
        //Перебираємо усі фото і їх зберігаємо або оновляємо
        foreach (var imgFile in model.ImageFiles!)
        {
            if (imgFile.ContentType == "old-image")
            {
                var img = await context.ProductImages
                    .Where(x => x.Name == imgFile.FileName)
                    .SingleOrDefaultAsync();
                img.Priority = p;
                context.SaveChanges();
            }

            else
            {
                try
                {
                    var productImage = new ProductImageEntity
                    {
                        ProductId = item.Id,
                        Name = await imageService.SaveImageAsync(imgFile),
                        Priority = p
                    };
                    context.ProductImages.Add(productImage);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error Json Parse Data for PRODUCT IMAGE", ex.Message);
                }
            }

            p++;

        }     

        await context.SaveChangesAsync();
        return item;
    }



    public async Task Delete(long id)
    {
        var product = await context.Products.Where(x => x.Id == id)
            .FirstOrDefaultAsync();
        product!.IsDeleted = true;
        await context.SaveChangesAsync();
    }

}

