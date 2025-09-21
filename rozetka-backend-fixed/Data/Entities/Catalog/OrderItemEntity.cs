using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities.Catalog;

public class OrderItemEntity : BaseEntity<long>
{
    public decimal PriceBuy { get; set; }
    public int Count { get; set; }
    [ForeignKey(nameof(Product))]
    public long ProductId { get; set; }
    [ForeignKey(nameof(Order))]
    public long OrderId { get; set; }
    public virtual ProductEntity Product { get; set; }
    public virtual OrderEntity Order { get; set; }

}
