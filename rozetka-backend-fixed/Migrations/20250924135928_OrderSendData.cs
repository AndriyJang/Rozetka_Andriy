using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rozetkabackend.Migrations
{
    /// <inheritdoc />
    public partial class OrderSendData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "tblOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConsumerFirstName",
                table: "tblOrders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConsumerPhone",
                table: "tblOrders",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConsumerSecondName",
                table: "tblOrders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HomeNumber",
                table: "tblOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Region",
                table: "tblOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Street",
                table: "tblOrders",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "tblOrders");

            migrationBuilder.DropColumn(
                name: "ConsumerFirstName",
                table: "tblOrders");

            migrationBuilder.DropColumn(
                name: "ConsumerPhone",
                table: "tblOrders");

            migrationBuilder.DropColumn(
                name: "ConsumerSecondName",
                table: "tblOrders");

            migrationBuilder.DropColumn(
                name: "HomeNumber",
                table: "tblOrders");

            migrationBuilder.DropColumn(
                name: "Region",
                table: "tblOrders");

            migrationBuilder.DropColumn(
                name: "Street",
                table: "tblOrders");
        }
    }
}
