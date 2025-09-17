using Microsoft.AspNetCore.Mvc;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Product;
using System.Threading.Tasks;

namespace RozetkaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController(IProductService productService) : ControllerBase
    {
        // GET /api/Products
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var model = await productService.List();
            return Ok(model);
        }

        // GET /api/Products/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var model = await productService.GetById((int)id);
            return Ok(model);
        }

        // GET /api/Products/slug/{slug}
        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var model = await productService.GetBySlug(slug);
            return Ok(model);
        }

        // POST /api/Products
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] ProductCreateModel model)
        {
            if (model.ImageFiles == null || model.ImageFiles.Count == 0)
                return BadRequest("Додайте хоча б одне фото (imageFiles).");

            var entity = await productService.Create(model);
            return Ok(entity.Id);
        }

        // PUT /api/Products/{id}
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Edit(long id, [FromForm] ProductEditModel model)
        {
            model.Id = id; // беремо id з роута
            var item = await productService.Edit(model);
            return Ok(item);
        }

        // DELETE /api/Products/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            await productService.Delete(id);
            return Ok();
        }
    }
}
