namespace rozetkabackend.Models.Order;

public class OrderItemModel
{
    public decimal PriceBuy { get; set; }
    public int Count { get; set; }
    public long ProductId { get; set; }
    public string ProductSlug { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductImage { get; set; } = string.Empty;
}
