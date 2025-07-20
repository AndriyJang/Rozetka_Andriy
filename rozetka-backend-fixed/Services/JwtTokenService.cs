using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using rozetkabackend.Entities.Identity;
using rozetkabackend.Interfaces;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;

namespace rozetkabackend.Services;

public class JwtTokenService(IConfiguration configuration,
    UserManager<UserEntity> userManager) : IJwtTokenService
{
    public async Task<string> CreateTokenAsync(UserEntity user)
    {
        var key = configuration["Jwt:Key"];

        var claims = new List<Claim>
        {
            new Claim("email", user.Email),
            new Claim("name", $"{user.LastName} {user.FirstName}")
        };
        foreach (var role in await userManager.GetRolesAsync(user))
        {
            claims.Add(new Claim("roles", role));
        }

        //ключ для підпису токена - перетворив у байти
        var keyBytes = System.Text.Encoding.UTF8.GetBytes(key);

        //створюємо об'єкт для підпису токена
        var symmetricSecurityKey = new SymmetricSecurityKey(keyBytes);

        //вказуємо ключ і алгоритм підпису токена
        var signingCredentials = new SigningCredentials(
            symmetricSecurityKey,
            SecurityAlgorithms.HmacSha256);

        //створюємо токен
        var jwtSecurityToken = new JwtSecurityToken(
            claims: claims, //список параметрів у токені, які є доступні
            expires: DateTime.UtcNow.AddDays(7), // термін дії токена - після цього часу токен буде недійсний
            signingCredentials: signingCredentials);

        string token = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);

        return token;
    }
}
