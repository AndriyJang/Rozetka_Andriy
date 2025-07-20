using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace rozetkabackend.Data.Entities
{
    [Table("tblProducts")]
    public class ProductEntity
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(255)]
        public string Title { get; set; }

        public string Description { get; set; }

        [Required, StringLength(255)]
        public decimal Price { get; set; }

        // Зовнішній ключ до категорії
        [ForeignKey(nameof(Category))]
        public int CategoryId { get; set; }

        // Навігаційна властивість
        public virtual CategoryEntity Category { get; set; }
    }
}
