using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rozetkabackend.Migrations
{
    /// <inheritdoc />
    public partial class ComentAddOrderEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Comment",
                table: "tblOrders",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Comment",
                table: "tblOrders");
        }
    }
}
