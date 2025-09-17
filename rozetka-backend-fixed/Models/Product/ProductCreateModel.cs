using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace rozetkabackend.Models.Product;

public class ProductCreateModel
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public long CategoryId { get; set; }

    public string Description { get; set; }

    /// <summary>
    /// List of uploaded image files for the product.
    /// </summary>
    //[BindProperty(Name = "imageFiles[]")]
    //public List<IFormFile>? ImageFiles { get; set; }
    [FromForm(Name = "imageFiles")] 
    public List<IFormFile>? ImageFiles { get; set; }
}
