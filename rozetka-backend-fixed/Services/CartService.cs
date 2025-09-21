using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Cart;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace rozetkabackend.Services;

public class CartService(AppDbContext appDbContext,
    IAuthService authService, IMapper mapper) : ICartService
{
    public async Task CreateUpdate(CartCreateUpdateModel model)
    {
        var userId = await authService.GetUserId();
        var entity = appDbContext.Carts
            .SingleOrDefault(x => x.UserId == userId && x.ProductId == model.ProductId);
        if (entity != null)
            entity.Quantity = model.Quantity;
        else
        {
            entity = new CartEntity
            {
                UserId = userId,
                ProductId = model.ProductId,
                Quantity = model.Quantity
            };
            appDbContext.Carts.Add(entity);
        }
        await appDbContext.SaveChangesAsync();
    }

    public async Task<List<CartItemModel>> GetCartItems()
    {
        var userId = await authService.GetUserId();

        var items = await appDbContext.Carts
            .Where(x => x.UserId == userId)
            .ProjectTo<CartItemModel>(mapper.ConfigurationProvider)
            .ToListAsync();

        return items;
    }

    public async Task Delete(long id)
    {
        var userId = await authService.GetUserId();
        var item = await appDbContext.Carts
            .SingleOrDefaultAsync(x => x.UserId == userId && x.ProductId == id);
        if (item != null)
        {
            appDbContext.Carts.Remove(item);
            await appDbContext.SaveChangesAsync();
        }
    }
}
