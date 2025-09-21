using rozetkabackend.Entities.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities.Catalog;

public class CartEntity
{
    [ForeignKey("Product")]
    public long ProductId { get; set; }
    [ForeignKey("User")]
    public long UserId { get; set; }

    [Range(0, 50)]
    public int Quantity { get; set; }

    public virtual ProductEntity Product { get; set; }
    public virtual UserEntity User { get; set; }
}
