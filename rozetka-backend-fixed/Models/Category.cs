using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RozetkaApi.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        // Навігаційна властивість для товарів у цій категорії
        public List<Product> Products { get; set; }
    }
}
