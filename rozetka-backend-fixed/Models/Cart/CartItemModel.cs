namespace rozetkabackend.Models.Cart;

public class CartItemModel
{
    public long ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string ImageName { get; set; } = string.Empty;
}
