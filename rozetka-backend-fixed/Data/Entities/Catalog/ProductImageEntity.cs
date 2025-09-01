using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities.Catalog;

[Table("tblProductImages")]
public class ProductImageEntity : BaseEntity<long>
{
    [StringLength(250)]
    public string Name { get; set; }

    public short Priority { get; set; }

    [ForeignKey("Product")]
    public long ProductId { get; set; }
    public ProductEntity Product { get; set; }
}
