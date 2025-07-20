using RozetkaApi.Data;
using RozetkaApi.Models;
using System.Collections.Generic;
using System.IO;
using System;
using System.Text.Json;
using System.Linq;

namespace RozetkaApi.Helpers
{
    public static class ProductSeeder
    {
        public static void SeedProducts(AppDbContext context)
        {
            // Створюємо категорії, якщо їх немає
            if (!context.Categories.Any())
            {
                var categories = new List<Category>
                {
                    new Category { Name = "Смартфони" },
                    new Category { Name = "Ноутбуки" },
                    new Category { Name = "Телевізори" }
                };
                context.Categories.AddRange(categories);
                context.SaveChanges();
            }

            if (!context.Products.Any())
            {
                var jsonPath = Path.Combine(Directory.GetCurrentDirectory(), "Helpers", "JsonData", "Products.json");

                if (File.Exists(jsonPath))
                {
                    var jsonData = File.ReadAllText(jsonPath);
                    var products = JsonSerializer.Deserialize<List<ProductJson>>(jsonData);

                    if (products != null)
                    {
                        foreach (var item in products)
                        {
                            var category = context.Categories.FirstOrDefault(c => c.Name == item.Category);
                            if (category != null)
                            {
                                context.Products.Add(new Product
                                {
                                    Title = item.Title,
                                    Price = item.Price,
                                    CategoryId = category.Id
                                });
                            }
                        }

                        context.SaveChanges();
                    }
                }
                else
                {
                    Console.WriteLine("Products.json not found at: " + jsonPath);
                }
            }
        }

        // DTO для десеріалізації JSON
        private class ProductJson
        {
            public string Title { get; set; }
            public string Category { get; set; }
            public decimal Price { get; set; }
        }
    }
}
