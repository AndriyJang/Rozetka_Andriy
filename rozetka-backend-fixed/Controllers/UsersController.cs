using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using System.Threading.Tasks;
using System;
using System.Linq;
using RozetkaApi.Dtos;
using rozetkabackend.Entities.Identity;
using RozetkaApi.Data.Entities;
using System.Text.RegularExpressions;
using RozetkaApi.Data.Entities;
using System.Text.RegularExpressions;


namespace RozetkaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<UserEntity> _userManager;

        public UsersController(AppDbContext context, UserManager<UserEntity> userManager)
        {
            _context = context;
            _userManager = userManager;
        }
        //[HttpPost("reset-by-email")]
        //public async Task<IActionResult> ResetByEmail([FromBody] EmailDto dto)
        //{
        //    var user = await _userManager.FindByEmailAsync(dto.Email);
        //    if (user == null)
        //        return NotFound("Користувача з таким email не знайдено");

        //    var tempPassword = GenerateTemporaryPassword();
        //    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        //    var result = await _userManager.ResetPasswordAsync(user, token, tempPassword);

        //    if (!result.Succeeded)
        //        return StatusCode(500, "Не вдалося скинути пароль");

        //    // ?? Тут має бути реальна логіка надсилання email
        //    Console.WriteLine($"EMAIL до {dto.Email}: Ваш тимчасовий пароль: {tempPassword}");

        //    return Ok("Тимчасовий пароль надіслано на email");
        //}
        [HttpPost("reset-by-phone")]
        //public async Task<IActionResult> ResetByPhone([FromBody] PhoneDto dto)
        //{
        //    var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == dto.Phone);
        //    if (user == null)
        //        return NotFound("Користувача з таким телефоном не знайдено");

        //    var tempPassword = GenerateTemporaryPassword();
        //    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        //    var result = await _userManager.ResetPasswordAsync(user, token, tempPassword);

        //    if (!result.Succeeded)
        //        return StatusCode(500, "Не вдалося скинути пароль");

        //    // ?? Тут має бути реальна логіка надсилання SMS
        //    Console.WriteLine($"SMS до {dto.Phone}: Ваш тимчасовий пароль: {tempPassword}");

        //    return Ok("Тимчасовий пароль надіслано через SMS");
        //}

        //private static string GenerateTemporaryPassword(int length = 8)
        //{
        //    const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        //    var random = new Random();
        //    return new string(Enumerable.Repeat(chars, length)
        //        .Select(s => s[random.Next(s.Length)]).ToArray());
        //}
      
[HttpPost("request-reset")]
    public async Task<IActionResult> RequestReset([FromBody] RequestResetDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) && string.IsNullOrWhiteSpace(dto.Phone))
            return BadRequest("Provide email or phone.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                (!string.IsNullOrEmpty(dto.Email) && u.Email == dto.Email) ||
                (!string.IsNullOrEmpty(dto.Phone) && u.PhoneNumber == dto.Phone));

        // Не розкриваємо існування користувача:
        if (user != null)
        {
            // створюємо 6-значний код
            var code = new Random().Next(100000, 999999).ToString();

            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                Code = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            });
            await _context.SaveChangesAsync();

            // TODO: замінити на реальну відправку
            if (!string.IsNullOrEmpty(dto.Email))
                Console.WriteLine($"EMAIL to {dto.Email}: reset code {code}");
            if (!string.IsNullOrEmpty(dto.Phone))
                Console.WriteLine($"SMS to {dto.Phone}: reset code {code}");
        }

        return Ok("If account exists, a reset code has been sent.");
    }

    [HttpPost("confirm-reset")]
    public async Task<IActionResult> ConfirmReset([FromBody] ConfirmResetDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest("Code and new password are required.");

        if (string.IsNullOrWhiteSpace(dto.Email) && string.IsNullOrWhiteSpace(dto.Phone))
            return BadRequest("Provide email or phone.");

        // політика як на фронті: 6 символів, малі латиниця/цифри, цифра не перша
        var pwdOk = Regex.IsMatch(dto.NewPassword, @"^(?=.*\d)(?!\d)[a-z0-9]{6}$");
        if (!pwdOk) return BadRequest("Password policy failed.");

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                (!string.IsNullOrEmpty(dto.Email) && u.Email == dto.Email) ||
                (!string.IsNullOrEmpty(dto.Phone) && u.PhoneNumber == dto.Phone));

        if (user == null) return BadRequest("Invalid user.");

        var now = DateTime.UtcNow;
        var token = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt >= now && t.Code == dto.Code)
            .OrderByDescending(t => t.Id)
            .FirstOrDefaultAsync();

        if (token == null) return BadRequest("Invalid or expired code.");

        // Міняємо пароль через Identity
        var identityToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, identityToken, dto.NewPassword);
        if (!result.Succeeded) return StatusCode(500, "Failed to reset password.");

        token.UsedAt = now;
        await _context.SaveChangesAsync();

        return Ok("Password has been reset.");
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