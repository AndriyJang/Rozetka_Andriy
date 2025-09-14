using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Product;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RozetkaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController(IProductService productService) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var model = await productService.List();

            return Ok(model);
        }

        [HttpGet("id/{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var model = await productService.GetById(id);

            return Ok(model);
        }

        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var model = await productService.GetBySlug(slug);

            return Ok(model);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromForm] ProductCreateModel model)
        {
            var salo = Request.Form;
            if (model.ImageFiles == null)
                return BadRequest("Image files are empty!");

            var entity = await productService.Create(model);

            if (entity != null)
                return Ok(entity.Id);

            else return BadRequest("Error create product!");
        }

        [HttpPut("edit")]
        public async Task<IActionResult> Edit([FromForm] ProductEditModel model)
        {
            var salo = Request.Form;
            var entity = await productService.Edit(model);
            if (entity != null)
                return Ok(model);
            else return BadRequest("Error edit product!");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            await productService.Delete(id);
            return Ok();
        }


    }
}
