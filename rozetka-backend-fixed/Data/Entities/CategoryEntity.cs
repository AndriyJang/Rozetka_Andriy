
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities;

[Table("tblCategories")]
public class CategoryEntity
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(255)]
    public string Name { get; set; }

    // Навігаційна властивість для товарів у цій категорії
    public virtual List<ProductEntity> Products { get; set; }
}
