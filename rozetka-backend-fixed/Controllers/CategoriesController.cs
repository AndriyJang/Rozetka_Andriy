using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace RozetkaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Categories
        //[HttpGet]
        //public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        //{
        //    return await _context.Categories.ToListAsync();
        //}
    }
}
