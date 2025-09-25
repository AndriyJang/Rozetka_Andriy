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
        // Статуси
        CreateMap<OrderStatusEntity, OrderStatusItemViewModel>();

        // Створення замовлення: з форми -> сутність
        CreateMap<OrderAddViewModel, OrderEntity>()
            // дата створення у UTC
            .ForMember(x => x.DateCreated, opt => opt.MapFrom(_ =>
                DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Utc)))
            // StatusId (VM) -> OrderStatusId (Entity)
            .ForMember(x => x.OrderStatusId, opt => opt.MapFrom(m => m.StatusId))
            // Позиції додаємо окремо в контролері
            .ForMember(x => x.OrderItems, opt => opt.Ignore());

        // Позиція замовлення: з форми -> сутність
        CreateMap<OrderItemAddViewModel, OrderItemEntity>()
            .ForMember(x => x.PriceBuy, opt => opt.MapFrom(m => m.BuyPrice))
            .ForMember(x => x.Count, opt => opt.MapFrom(m => m.Quantity))
            // ProductId збігається за назвою; AutoMapper сам сконвертує int -> long
            ;

        // Позиція замовлення: з сутності -> VM (для відображення в історії)
        CreateMap<OrderItemEntity, OrderItemViewModel>()
            .ForMember(x => x.ProductName, opt => opt.MapFrom(e => e.Product.Name))
            .ForMember(x => x.ProductImage, opt => opt.MapFrom(e => e.Product.ProductImages.Select(pi => pi.Name)))
            .ForMember(x => x.BuyPrice, opt => opt.MapFrom(e => e.PriceBuy))
            .ForMember(x => x.Quantity, opt => opt.MapFrom(e => e.Count));

        // Замовлення: з сутності -> VM
        CreateMap<OrderEntity, OrderViewModel>()
            .ForMember(x => x.DateCreated, opt => opt.MapFrom(e => e.DateCreated.ToString("dd.MM.yyyy HH:mm:ss")))
            .ForMember(x => x.StatusName, opt => opt.MapFrom(e => e.OrderStatus.Name))
            .ForMember(x => x.Items, opt => opt.MapFrom(e => e.OrderItems));
    }
}
