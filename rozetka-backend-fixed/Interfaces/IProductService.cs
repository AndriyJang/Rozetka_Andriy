using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Models.Product;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace rozetkabackend.Interfaces;

public interface IProductService
{
    Task<List<ProductItemModel>> List();
    Task<ProductItemModel> GetById(int id);
    Task<List<ProductItemModel>> GetBySlug(string slug);
    Task<ProductEntity> Create(ProductCreateModel model);
    Task<ProductItemModel> Edit(ProductEditModel model);
    Task Delete(long id);
}
