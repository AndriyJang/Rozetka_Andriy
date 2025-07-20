using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using RozetkaApi.Models;
using System.Threading.Tasks;
using System;
using System.Linq;

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
        [HttpPost("reset-by-email")]
        public async Task<IActionResult> ResetByEmail([FromBody] EmailDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return NotFound("����������� � ����� email �� ��������");

            var tempPassword = GenerateTemporaryPassword();
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, tempPassword);

            if (!result.Succeeded)
                return StatusCode(500, "�� ������� ������� ������");

            // ?? ��� �� ���� ������� ����� ���������� email
            Console.WriteLine($"EMAIL �� {dto.Email}: ��� ���������� ������: {tempPassword}");

            return Ok("���������� ������ �������� �� email");
        }
        [HttpPost("reset-by-phone")]
        public async Task<IActionResult> ResetByPhone([FromBody] PhoneDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == dto.Phone);
            if (user == null)
                return NotFound("����������� � ����� ��������� �� ��������");

            var tempPassword = GenerateTemporaryPassword();
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, tempPassword);

            if (!result.Succeeded)
                return StatusCode(500, "�� ������� ������� ������");

            // ?? ��� �� ���� ������� ����� ���������� SMS
            Console.WriteLine($"SMS �� {dto.Phone}: ��� ���������� ������: {tempPassword}");

            return Ok("���������� ������ �������� ����� SMS");
        }

        private static string GenerateTemporaryPassword(int length = 8)
        {
            const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        //[HttpPost("register")]
        //public IActionResult Register([FromBody] User user)
        //{
        //    if (string.IsNullOrEmpty(user.Email) || string.IsNullOrEmpty(user.Password))
        //        return BadRequest("Invalid input");

        //    _context.Users.Add(user);
        //    _context.SaveChanges();

        //    return Ok(user);
        //}
    }
}