using rozetkabackend.Models.Category;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace rozetkabackend.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryItemModel>> List();
    Task<CategoryItemModel?> GetItemById(int id);
    Task<CategoryItemModel> Create(CategoryCreateModel model);
    Task<CategoryItemModel> Update(CategoryEditModel model);
    Task Delete(long id);
}
