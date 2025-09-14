using AutoMapper;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Models.Category;
using rozetkabackend.Models.Seeder;

namespace rozetkabackend.Mapper;

public class CategoryMapper : Profile
{
    public CategoryMapper()
    {
        CreateMap<SeederCategoryModel, CategoryEntity>();
        CreateMap<CategoryEntity, CategoryItemModel>();
        //.ForMember(x => x.Image, opt => opt.Ignore());
        CreateMap<CategoryCreateModel, CategoryEntity>()
            .ForMember(x => x.Name, opt => opt.MapFrom(x=>x.Name.Trim()))
            .ForMember(x => x.Slug, opt => opt.MapFrom(x => x.Slug.Trim()))
            .ForMember(x => x.Image, opt => opt.Ignore());

        CreateMap<CategoryEditModel, CategoryEntity>()
            .ForMember(x => x.Name, opt => opt.MapFrom(x => x.Name.Trim()))
            .ForMember(x => x.Slug, opt => opt.MapFrom(x => x.Slug.Trim()))
            .ForMember(x => x.Image, opt => opt.Ignore());
    }
}
