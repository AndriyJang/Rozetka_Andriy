using rozetkabackend.Entities.Identity;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities.Catalog;

[Table("tblOrders")]
public class OrderEntity : BaseEntity<long>
{
    [ForeignKey(nameof(OrderStatus))]
    public long OrderStatusId { get; set; }
    [ForeignKey(nameof(User))]
    public long UserId { get; set; }
    public OrderStatusEntity? OrderStatus { get; set; }
    public UserEntity? User { get; set; }

    public ICollection<OrderItemEntity> OrderItems { get; set; }

}
