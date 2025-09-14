using AutoMapper;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Models.Product;
using System.Linq;

namespace rozetkabackend.Mapper;

public class ProductMapper : Profile
{
    public ProductMapper()
    {
        CreateMap<ProductImageEntity, ProductImageModel>();

        CreateMap<ProductEntity, ProductItemModel>()
            .ForMember(src => src.ProductImages, opt => opt
                .MapFrom(x => x.ProductImages!.OrderBy(p => p.Priority)));

        CreateMap<ProductCreateModel, ProductEntity>()
            .ForMember(x => x.ProductImages, opt => opt.Ignore());

        CreateMap<ProductEditModel, ProductEntity>()
            .ForMember(dest => dest.Category, opt => opt.Ignore())
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ProductImages, opt => opt.Ignore());
    }
}
