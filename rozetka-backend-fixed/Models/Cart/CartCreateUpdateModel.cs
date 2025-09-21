namespace rozetkabackend.Models.Cart;

public class CartCreateUpdateModel
{
    public long ProductId { get; set; }
    public int Quantity { get; set; } = 1;
}