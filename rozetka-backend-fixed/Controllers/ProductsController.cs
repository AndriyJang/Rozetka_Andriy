using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RozetkaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        //GET: api/Products/sorting?query=milk&sortBy=price&descending=true
        //[HttpGet("sorting")]
        //public async Task<ActionResult<IEnumerable<Product>>> Sorting(string query, 
        //                                                              string sortBy = null, 
        //                                                              bool descending = false)
        //{
        //    // базовий запит
        //    IQueryable<Product> products = _context.Products.Include(p => p.Category);

        //    // пошук
        //    if (!string.IsNullOrWhiteSpace(query))
        //    {
        //        var lower = query.ToLower();
        //        products = products.Where(p =>
        //            p.Title.ToLower().Contains(lower) ||
        //            p.Category.Name.ToLower().Contains(lower));
        //    }

        //    // сортування
        //    switch (sortBy?.ToLower())
        //    {
        //        case "title":
        //            products = descending
        //                ? products.OrderByDescending(p => p.Title)
        //                : products.OrderBy(p => p.Title);
        //            break;
        //        case "price":
        //            products = descending
        //                ? products.OrderByDescending(p => p.Price)
        //                : products.OrderBy(p => p.Price);
        //            break;
        //        case "category":
        //            products = descending
        //                ? products.OrderByDescending(p => p.Category.Name)
        //                : products.OrderBy(p => p.Category.Name);
        //            break;
        //        default:
        //            // якщо не вказано – сортуємо за Id
        //            products = products.OrderBy(p => p.Id);
        //            break;
        //    }

        //    return await products.ToListAsync();
        //} Це Валентин зробив

        // GET: api/Products/search?query=назва
        //[HttpGet("search")]
        //public async Task<ActionResult<IEnumerable<Product>>> Search(string query)
        //{
        //    if (string.IsNullOrWhiteSpace(query))
        //    {
        //        return await _context.Products
        //            .Include(p => p.Category)
        //            .ToListAsync();
        //    }

        //    return await _context.Products
        //        .Include(p => p.Category)
        //        .Where(p => p.Title.ToLower().Contains(query.ToLower()) ||
        //                    p.Category.Name.ToLower().Contains(query.ToLower()))
        //        .ToListAsync();
        //}

        //// GET: api/Products
        //[HttpGet]
        //public async Task<ActionResult<IEnumerable<Product>>> GetAll()
        //{
        //    return await _context.Products.Include(p => p.Category).ToListAsync();
        //}

        // GET: api/Products/look?query=milk
        //[HttpGet]
        //public async Task<ActionResult<IEnumerable<Product>>> LookTheProduct(string query)
        //{
        //    return await _context.Products
        //        .Include(p => p.Category)
        //        .Where(p => p.Title.ToLower().Contains(query.ToLower()) ||
        //                    p.Category.Name.ToLower().Contains(query.ToLower()))
        //        .ToListAsync();
        //}
    }
}
