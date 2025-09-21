using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities.Catalog;

[Table("tblProducts")]
public class ProductEntity : BaseEntity<long>
{
    [Required, StringLength(250)]
    public string Name { get; set; }

    [Required, StringLength(250)]
    public string Slug { get; set; }

    public decimal Price { get; set; }

    [StringLength(10000)]
    public string Description { get; set; }

    [ForeignKey("Category")]
    public long CategoryId { get; set; }

    public CategoryEntity Category { get; set; }

    public ICollection<ProductImageEntity> ProductImages { get; set; }
    public ICollection<CartEntity> Carts { get; set; }
}
