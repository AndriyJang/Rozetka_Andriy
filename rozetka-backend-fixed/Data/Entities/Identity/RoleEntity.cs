using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace rozetkabackend.Entities.Identity;

public class RoleEntity : IdentityRole<long>
{
    public virtual ICollection<UserRoleEntity> UserRoles { get; set; }
    public RoleEntity() : base() { }
    public RoleEntity(string roleName) : base(roleName) { }
}
