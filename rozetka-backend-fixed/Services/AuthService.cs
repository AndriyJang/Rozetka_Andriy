using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using rozetkabackend.Entities.Identity;
using rozetkabackend.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace rozetkabackend.Services;

public class AuthService(IHttpContextAccessor httpContextAccessor,
    UserManager<UserEntity> userManager) : IAuthService
{
    public async Task<long> GetUserId()
    {
        var email = httpContextAccessor.HttpContext?.User?.Claims.First().Value;
        if (string.IsNullOrEmpty(email))
            throw new UnauthorizedAccessException("User is not authenticated");
        var user = await userManager.FindByEmailAsync(email);

        return user.Id;
    }
}
