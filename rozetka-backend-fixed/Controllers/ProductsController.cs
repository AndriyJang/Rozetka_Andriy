using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using RozetkaApi.Models;
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

        // GET: api/Products/search?query=назва
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Product>>> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await _context.Products
                    .Include(p => p.Category)
                    .ToListAsync();
            }

            return await _context.Products
                .Include(p => p.Category)
                .Where(p => p.Title.ToLower().Contains(query.ToLower()) ||
                            p.Category.Name.ToLower().Contains(query.ToLower()))
                .ToListAsync();
        }

        // GET: api/Products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetAll()
        {
            return await _context.Products.Include(p => p.Category).ToListAsync();
        }
    }
}
