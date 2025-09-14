using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Category;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace rozetkabackend.Services;

public class CategoryService(AppDbContext pizushiContext,
    IMapper mapper, IImageService imageService) : ICategoryService
{
    public async Task<CategoryItemModel> Create(CategoryCreateModel model)
    {
        var entity = mapper.Map<CategoryEntity>(model);
        entity.Image = await imageService.SaveImageAsync(model.ImageFile!);
        await pizushiContext.Categories.AddAsync(entity);
        await pizushiContext.SaveChangesAsync();
        var item = mapper.Map<CategoryItemModel>(entity);
        return item;
    }

    public async Task Delete(long id)
    {
        var entity = await pizushiContext.Categories.Where(x => x.Id == id)
            .FirstOrDefaultAsync();
        entity!.IsDeleted = true;
        await pizushiContext.SaveChangesAsync();
    }

    public async Task<CategoryItemModel?> GetItemById(int id)
    {
        var model = await mapper
            .ProjectTo<CategoryItemModel>(pizushiContext.Categories.Where(x => !x.IsDeleted).Where(x => x.Id == id))
            .SingleOrDefaultAsync();
        return model;
    }

    public async Task<List<CategoryItemModel>> List()
    {
        var model = await mapper.ProjectTo<CategoryItemModel>(pizushiContext.Categories.Where(x => !x.IsDeleted))
            .ToListAsync();
        return model;
    }

    public async Task<CategoryItemModel> Update(CategoryEditModel model)
    {
        var existing = await pizushiContext.Categories.Where(x => !x.IsDeleted).FirstOrDefaultAsync(x => x.Id == model.Id);

        existing = mapper.Map(model, existing);

        if (model.ImageFile != null)
        {
            await imageService.DeleteImageAsync(existing.Image);
            existing.Image = await imageService.SaveImageAsync(model.ImageFile);
        }
        await pizushiContext.SaveChangesAsync();

        var item = mapper.Map<CategoryItemModel>(existing);
        return item;
    }
}
