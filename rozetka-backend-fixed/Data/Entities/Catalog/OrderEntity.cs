using rozetkabackend.Entities.Identity;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities.Catalog;

[Table("tblOrders")]
public class OrderEntity : BaseEntity<long>
{
    [ForeignKey(nameof(OrderStatus))]
    public long OrderStatusId { get; set; }
    [ForeignKey(nameof(User))]
    public long UserId { get; set; }
    public string Comment { get; set; }
    /// <summary>
    /// Контакти отримувача
    /// </summary>
    [StringLength(100)]
    public string ConsumerFirstName { get; set; }
    [StringLength(100)]
    public string ConsumerSecondName { get; set; }
    [StringLength(20)]
    public string ConsumerPhone { get; set; }

    /// <summary>
    /// Дані доставки товару
    /// </summary>
    public string Region { get; set; }
    public string City { get; set; }
    public string Street { get; set; }
    public string HomeNumber { get; set; }

    public OrderStatusEntity? OrderStatus { get; set; }
    public UserEntity? User { get; set; }

    public ICollection<OrderItemEntity> OrderItems { get; set; }

}
