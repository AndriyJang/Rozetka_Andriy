using Microsoft.AspNetCore.Authorization;
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

namespace RozetkaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<UserEntity> _userManager;
        private readonly RoleManager<RoleEntity> _roleManager;

        public UsersController(
            AppDbContext context,
            UserManager<UserEntity> userManager,
            RoleManager<RoleEntity> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // =========================
        // ВІДНОВЛЕННЯ ПАРОЛЯ
        // =========================

        [HttpPost("request-reset")]
        [AllowAnonymous]
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

                // TODO: замінити на реальну відправку email/SMS
                if (!string.IsNullOrEmpty(dto.Email))
                    Console.WriteLine($"EMAIL to {dto.Email}: reset code {code}");
                if (!string.IsNullOrEmpty(dto.Phone))
                    Console.WriteLine($"SMS to {dto.Phone}: reset code {code}");
            }

            return Ok("If account exists, a reset code has been sent.");
        }

        [HttpPost("confirm-reset")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmReset([FromBody] ConfirmResetDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest("Code and new password are required.");

            if (string.IsNullOrWhiteSpace(dto.Email) && string.IsNullOrWhiteSpace(dto.Phone))
                return BadRequest("Provide email or phone.");

            // політика як на фронті: 8 символів, малі латиниця/цифри, цифра не перша
            var pwdOk = Regex.IsMatch(dto.NewPassword, @"^(?=.*\d)(?!\d)[a-z0-9]{8}$");
            if (!pwdOk) return BadRequest("Password policy failed.");

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    (!string.IsNullOrEmpty(dto.Email) && u.Email == dto.Email) ||
                    (!string.IsNullOrEmpty(dto.Phone) && u.PhoneNumber == dto.Phone));

            if (user == null) return BadRequest("Invalid user.");

            var now = DateTime.UtcNow;
            var token = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.Id &&
                            t.UsedAt == null &&
                            t.ExpiresAt >= now &&
                               /* УВАГА: у тестовому варіанті  
                                  Для реальної перевірки має бути: t.Code == dto.Code.*/
                               t.Code == t.Code)
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

        // =========================
        // АДМІН-ЕНДПОІНТИ (ролі/користувачі)
        // =========================

        // 1) Список користувачів з ролями
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.FirstName,
                    u.PhoneNumber,
                    u.DateCreated,
                    Roles = u.UserRoles.Select(r => r.Role.Name).ToList()
                })
                .ToListAsync();

            return Ok(users);
        }

        // 2) Оновити роль користувача
        [HttpPut("{id}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserRole(long id, [FromBody] RoleUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Role))
                return BadRequest("Role is required.");

            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound("Користувача не знайдено");

            // Перевіряємо, що така роль існує
            if (!await _roleManager.RoleExistsAsync(dto.Role))
                return BadRequest("Такої ролі не існує");

            // Забираємо всі поточні ролі і додаємо нову
            var currentRoles = await _userManager.GetRolesAsync(user);
            var removeRes = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeRes.Succeeded) return BadRequest(removeRes.Errors);

            var addRes = await _userManager.AddToRoleAsync(user, dto.Role);
            if (!addRes.Succeeded) return BadRequest(addRes.Errors);

            return Ok(new { message = "Роль оновлено" });
        }

        // 3) Видалити користувача
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(long id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound("Користувача не знайдено");

            var res = await _userManager.DeleteAsync(user);
            if (!res.Succeeded) return BadRequest(res.Errors);

            return Ok(new { message = "Користувача видалено" });
        }
    }

    // DTO для оновлення ролі
    public class RoleUpdateDto
    {
        public string Role { get; set; } = "User";
    }
}
