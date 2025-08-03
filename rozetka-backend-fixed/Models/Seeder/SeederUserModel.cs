using System.Collections.Generic;
using static Bogus.DataSets.Name;

namespace rozetkabackend.Models.Seeder;

public class SeederUserModel
{
    public Gender Gender { get; set; }
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Image { get; set; }
    public string Password { get; set; }
    public List<string> Roles { get; set; }
}
