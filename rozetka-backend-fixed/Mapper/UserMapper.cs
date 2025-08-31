using AutoMapper;
using rozetkabackend.Entities.Identity;
using rozetkabackend.Models.Account;
using rozetkabackend.Models.Seeder;

namespace rozetkabackend.Mapper;

public class UserMapper : Profile
{
    public UserMapper()
    {
        CreateMap<RegisterModel, UserEntity>()
            .ForMember(x => x.UserName, opt => opt.MapFrom(x => x.Email));

        CreateMap<SeederUserModel, UserEntity>()
            .ForMember(opt => opt.UserName, opt => opt.MapFrom(x => x.Email));
    }
}
