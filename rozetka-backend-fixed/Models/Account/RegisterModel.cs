
namespace rozetkabackend.Models.Account;

public class RegisterModel
{
    /// <summary>
    /// Ім'я користувача
    /// </summary>
    /// <example>name</example>
    public string FirstName { get; set; }

    /// <summary>
    /// Прізвище користувача
    /// </summary>
    /// <example>surname</example>
    public string LastName { get; set; }

    /// <summary>
    /// Електронна пошта користувача
    /// </summary>
    /// <example>admin@example.com</example>
    public string Email { get; set; }

    /// <summary>
    /// Пароль пошта користувача
    /// </summary>
    /// <example>pass123?</example>
    public string Password { get; set; }
}
