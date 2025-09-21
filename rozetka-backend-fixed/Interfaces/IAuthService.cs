using System.Threading.Tasks;

namespace rozetkabackend.Interfaces;

public interface IAuthService
{
    Task<long> GetUserId();
}
