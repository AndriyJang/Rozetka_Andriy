using rozetkabackend.Entities.Identity;
using System.Threading.Tasks;

namespace rozetkabackend.Interfaces;

public interface IJwtTokenService
{
    Task<string> CreateTokenAsync(UserEntity user);
}
