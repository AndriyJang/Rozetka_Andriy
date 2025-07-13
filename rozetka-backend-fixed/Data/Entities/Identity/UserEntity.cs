using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace rozetkabackend.Entities.Identity;

public class UserEntity : IdentityUser<long>
{
    public DateTime DateCreated { get; set; } = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Utc);
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Image { get; set; }

    public virtual ICollection<UserRoleEntity> UserRoles { get; set; }

    //public virtual ICollection<IdentityUserLogin<string>> UserLogins { get; set; }

    //IsLoginGoogle = u.UserLogins.Any(l => l.LoginProvider == "Google"),
    public virtual ICollection<UserLoginEntity> Logins { get; set; }
}
