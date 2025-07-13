using Microsoft.AspNetCore.Mvc;
using RozetkaApi.Data;
using RozetkaApi.Models;

namespace RozetkaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] User user)
        {
            if (string.IsNullOrEmpty(user.Email) || string.IsNullOrEmpty(user.Password))
                return BadRequest("Invalid input");

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(user);
        }
    }
}