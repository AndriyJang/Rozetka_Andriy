using rozetkabackend.Models.Category;
using System.Collections.Generic;

namespace rozetkabackend.Models.Product;

public class ProductItemModel
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Description { get; set; }
    public CategoryItemModel? Category { get; set; }
    public List<ProductImageModel>? ProductImages { get; set; }
}
