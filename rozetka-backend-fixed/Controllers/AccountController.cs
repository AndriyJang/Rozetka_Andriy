using AutoMapper;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using rozetkabackend.Constants;
using rozetkabackend.Entities.Identity;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Account;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace rozetkabackend.Controllers;

[Route("api/[controller]/[action]")]
[ApiController]
public class AccountController(
    IMapper mapper,
    IJwtTokenService jwt,
    UserManager<UserEntity> userManager,
    SignInManager<UserEntity> signInManager,
    IConfiguration cfg
) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        var user = await userManager.FindByEmailAsync(model.Email);
        if (user != null && await userManager.CheckPasswordAsync(user, model.Password))
        {
            var token = await jwt.CreateTokenAsync(user);
            return Ok(new { Token = token });
        }
        return Unauthorized("Invalid email or password");
    }

    [HttpPost]
    public async Task<IActionResult> Register([FromForm] RegisterModel model)
    {
        var user = mapper.Map<UserEntity>(model);

        var result = await userManager.CreateAsync(user, model.Password);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(user, Roles.User);
            var token = await jwt.CreateTokenAsync(user);
            return Ok(new { Token = token });
        }
        else
        {
            return BadRequest(new
            {
                status = 400,
                isValid = false,
                errors = "Registration failed"
            });
        }
    }

    // ========== НОВІ МЕТОДИ ДЛЯ GOOGLE ==========

    [HttpGet("{provider}")]
    [AllowAnonymous]
    public IActionResult ExternalLogin(string provider)
    {
        var scheme = provider.Equals("google", StringComparison.OrdinalIgnoreCase)
       ? GoogleDefaults.AuthenticationScheme   // це "Google"
       : provider;

        var redirectUrl = Url.Action(nameof(ExternalLoginCallback), "Account", null, Request.Scheme);
        var props = signInManager.ConfigureExternalAuthenticationProperties(scheme, redirectUrl);
        return Challenge(props, scheme);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> ExternalLoginCallback()
    {
        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info == null)
            return Redirect($"{cfg["Authentication:FrontendUrl"]}/login?error=google");

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email))
            return Redirect($"{cfg["Authentication:FrontendUrl"]}/login?error=noemail");

        // Перевіряємо юзера
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new UserEntity
            {
                UserName = email,
                Email = email,
                FirstName = info.Principal.Identity?.Name ?? "Google User"
            };
            var createRes = await userManager.CreateAsync(user);
            if (!createRes.Succeeded)
                return Redirect($"{cfg["Authentication:FrontendUrl"]}/login?error=create");

            await userManager.AddLoginAsync(user, info);
            await userManager.AddToRoleAsync(user, Roles.User);
        }

        // Якщо логін ще не прив’язаний — прив’яжемо
        var logins = await userManager.GetLoginsAsync(user);
        if (!logins.Any(l => l.LoginProvider == info.LoginProvider && l.ProviderKey == info.ProviderKey))
            await userManager.AddLoginAsync(user, info);

        // Видати наш JWT
        var token = await jwt.CreateTokenAsync(user);

        // Редірект на фронт
        var front = cfg["Authentication:FrontendUrl"]?.TrimEnd('/');
        return Redirect($"{front}/oauth-callback#token={token}");
    }
}
