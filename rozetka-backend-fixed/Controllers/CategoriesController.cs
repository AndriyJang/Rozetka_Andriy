using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Category;

namespace rozetkabackend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var model = await categoryService.List();
        return Ok(model);
    }

    //[Authorize(Roles = $"{Roles.Admin}")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetItemById(int id)
    {
        var model = await categoryService.GetItemById(id);
        if (model == null)
        {
            return NotFound();
        }
        return Ok(model);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CategoryCreateModel model)
    {
        var category = await categoryService.Create(model);
        return Ok(category);
    }

    [HttpPut] //Якщо є метод Put - це значить змінна даних
    public async Task<IActionResult> Update([FromForm] CategoryEditModel model)
    {
        var category = await categoryService.Update(model);

        return Ok(category);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        await categoryService.Delete(id);
        return Ok();
    }
}
