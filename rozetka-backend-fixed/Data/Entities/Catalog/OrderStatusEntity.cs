using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities.Catalog;

[Table("tblOrderStatuses")]
public class OrderStatusEntity : BaseEntity<long>
{
    [StringLength(250)]
    public string Name { get; set; }
    public ICollection<OrderEntity> Orders { get; set; }
}

