using rozetkabackend.Models.Cart;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace rozetkabackend.Interfaces;

public interface ICartService
{
    Task CreateUpdate(CartCreateUpdateModel model);
    Task<List<CartItemModel>> GetCartItems();
    Task Delete(long id);
}
