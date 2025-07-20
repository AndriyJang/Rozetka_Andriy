using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RozetkaApi.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        [Required]
        public decimal Price { get; set; }

        // Зовнішній ключ до категорії
        [ForeignKey("Category")]
        public int CategoryId { get; set; }

        // Навігаційна властивість
        public Category Category { get; set; }
    }
}
