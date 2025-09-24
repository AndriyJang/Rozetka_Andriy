using AutoMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RozetkaApi.Data;
using rozetkabackend.Seeder;
using rozetkabackend.Constants;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Entities.Identity;
using rozetkabackend.Interfaces;
using rozetkabackend.Models.Seeder;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace rozetkabackend;

public static class DbSeeder
{
    public static async Task SeedData(this WebApplication webApplication)
    {
        using var scope = webApplication.Services.CreateScope();
        //Цей об'єкт буде верта посилання на конткетс, який зараєстрвоано в Progran.cs
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<RoleEntity>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<UserEntity>>();
        var mapper = scope.ServiceProvider.GetRequiredService<IMapper>();

        context.Database.Migrate();

        if (!context.Roles.Any())
        {
            foreach (var roleName in Roles.AllRoles)
            {
                var result = await roleManager.CreateAsync(new(roleName));
                if (!result.Succeeded)
                {
                    Console.WriteLine("Error Create Role {0}", roleName);
                }
            }
        }
        //ProductSeeder.SeedProducts(context);

        if (!context.Categories.Any())
        {
            var imageService = scope.ServiceProvider.GetRequiredService<IImageService>();
            var jsonFile = Path.Combine(Directory.GetCurrentDirectory(), "Helpers", "JsonData", "Categories.json");
            if (File.Exists(jsonFile))
            {
                var jsonData = await File.ReadAllTextAsync(jsonFile);
                try
                {
                    var categories = JsonSerializer.Deserialize<List<SeederCategoryModel>>(jsonData);
                    var entityItems = mapper.Map<List<CategoryEntity>>(categories);
                    foreach (var entity in entityItems)
                    {
                        entity.Image =
                            await imageService.SaveImageFromUrlAsync(entity.Image);
                    }

                    await context.AddRangeAsync(entityItems);
                    await context.SaveChangesAsync();

                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error Json Parse Data {0}", ex.Message);
                }
            }
            else
            {
                Console.WriteLine("Not Found File Categories.json");
            }
        }


        if (!context.Users.Any())
        {
            var jsonFile = Path.Combine(Directory.GetCurrentDirectory(), "Helpers", "JsonData", "Users.json");
            if (File.Exists(jsonFile))
            {
                var jsonData = await File.ReadAllTextAsync(jsonFile);
                try
                {
                    var users = JsonSerializer.Deserialize<List<SeederUserModel>>(jsonData);
                    foreach (var user in users)
                    {
                        var entity = mapper.Map<UserEntity>(user);
                        entity.UserName = user.Email;
                        var result = await userManager.CreateAsync(entity, user.Password);
                        if (!result.Succeeded)
                        {
                            Console.WriteLine("Error Create User {0}", user.Email);
                            continue;
                        }
                        foreach (var role in user.Roles)
                        {
                            if (await roleManager.RoleExistsAsync(role))
                            {
                                await userManager.AddToRoleAsync(entity, role);
                            }
                            else
                            {
                                Console.WriteLine("Not Found Role {0}", role);
                            }
                        }
                    }

                }
                catch (Exception ex)
                {
                    Console.WriteLine("Error Json Parse Data {0}", ex.Message);
                }
            }
            else
            {
                Console.WriteLine("Not Found File Users.json");
            }
        }
        if (!context.OrderStatuses.Any())
        {
            context.OrderStatuses
                .Add(new OrderStatusEntity
                {
                    Name = "Новий заказ"
                });
            context.OrderStatuses
                .Add(new OrderStatusEntity
                {
                    Name = "В роботі"
                });
            context.OrderStatuses
                .Add(new OrderStatusEntity
                {
                    Name = "Відправлено"
                });
            context.OrderStatuses
                .Add(new OrderStatusEntity
                {
                    Name = "Прибув"
                });
            context.OrderStatuses
                .Add(new OrderStatusEntity
                {
                    Name = "Відхилено"
                });
            context.OrderStatuses
                .Add(new OrderStatusEntity
                {
                    Name = "Отримано"
                });
            context.SaveChanges();
        }
    }
}
