namespace RozetkaApi.Dtos
{
    public class EmailDto
    {
        public string Email { get; set; }
    }

    public class PhoneDto
    {
        public string Phone { get; set; }
    }
    public class RequestResetDto
    {
        public string? Email { get; set; }
        public string? Phone { get; set; }
    }

    public class ConfirmResetDto
    {
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Code { get; set; } = default!;
        public string NewPassword { get; set; } = default!;
    }
}
