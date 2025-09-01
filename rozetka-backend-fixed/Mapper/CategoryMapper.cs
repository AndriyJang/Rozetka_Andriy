using AutoMapper;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Models.Seeder;

namespace rozetkabackend.Mapper;

public class CategoryMapper : Profile
{
    public CategoryMapper()
    {
        CreateMap<SeederCategoryModel, CategoryEntity>();
    }
}
