using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using rozetkabackend.Constants;
using rozetkabackend.Entities.Identity;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Account;
using System.Threading.Tasks;

namespace rozetkabackend.Controllers;

[Route("api/[controller]/[action]")]
[ApiController]
public class AccountController(
    IMapper mapper,
    IJwtTokenService jwtTokenService,
    UserManager<UserEntity> userManager
    ) : ControllerBase
{

    [HttpPost]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        var user = await userManager.FindByEmailAsync(model.Email);
        if (user != null && await userManager.CheckPasswordAsync(user, model.Password))
        {
            var token = await jwtTokenService.CreateTokenAsync(user);
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
            //await userManager.AddToRoleAsync(user, );
            var token = await jwtTokenService.CreateTokenAsync(user);
            return Ok(new
            {
                Token = token
            });
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

}
