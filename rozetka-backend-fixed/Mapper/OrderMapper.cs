using AutoMapper;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Models.Order;
using System;
using System.Linq;

namespace rozetkabackend.Mapper;

public class OrderMapper : Profile
{
    public OrderMapper()
    {
        CreateMap<OrderStatusEntity, OrderStatusItemViewModel>();
        CreateMap<OrderAddViewModel, OrderEntity>()
            .ForMember(x => x.DateCreated, opt => opt.MapFrom(x =>
                DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Utc)))
            .ForMember(x => x.OrderItems, opt => opt.Ignore());

        CreateMap<OrderItemAddViewModel, OrderItemEntity>();

        CreateMap<OrderItemEntity, OrderItemViewModel>()
            .ForMember(x => x.ProductName, opt => opt.MapFrom(x => x.Product.Name))
            .ForMember(x => x.ProductImage, opt => opt.MapFrom(x => x.Product.ProductImages.Select(x => x.Name)));

        CreateMap<OrderEntity, OrderViewModel>()
            .ForMember(x => x.DateCreated, opt => opt.MapFrom(x => x.DateCreated.ToString("dd.MM.yyyy HH:mm:ss")))
            .ForMember(x => x.StatusName, opt => opt.MapFrom(x => x.OrderStatus.Name))
            .ForMember(x => x.Items, opt => opt.MapFrom(x => x.OrderItems));
    }
}