using Microsoft.AspNetCore.Identity;

namespace rozetkabackend.Entities.Identity;

public class UserLoginEntity : IdentityUserLogin<long>
{
    public UserEntity User { get; set; } 
}
