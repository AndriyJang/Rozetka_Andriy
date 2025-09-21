using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rozetkabackend.Migrations
{
    /// <inheritdoc />
    public partial class AddColCarts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CartEntity_AspNetUsers_UserId",
                table: "CartEntity");

            migrationBuilder.DropForeignKey(
                name: "FK_CartEntity_tblProducts_ProductId",
                table: "CartEntity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CartEntity",
                table: "CartEntity");

            migrationBuilder.RenameTable(
                name: "CartEntity",
                newName: "Carts");

            migrationBuilder.RenameIndex(
                name: "IX_CartEntity_UserId",
                table: "Carts",
                newName: "IX_Carts_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Carts",
                table: "Carts",
                columns: new[] { "ProductId", "UserId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_AspNetUsers_UserId",
                table: "Carts",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_tblProducts_ProductId",
                table: "Carts",
                column: "ProductId",
                principalTable: "tblProducts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Carts_AspNetUsers_UserId",
                table: "Carts");

            migrationBuilder.DropForeignKey(
                name: "FK_Carts_tblProducts_ProductId",
                table: "Carts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Carts",
                table: "Carts");

            migrationBuilder.RenameTable(
                name: "Carts",
                newName: "CartEntity");

            migrationBuilder.RenameIndex(
                name: "IX_Carts_UserId",
                table: "CartEntity",
                newName: "IX_CartEntity_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CartEntity",
                table: "CartEntity",
                columns: new[] { "ProductId", "UserId" });

            migrationBuilder.AddForeignKey(
                name: "FK_CartEntity_AspNetUsers_UserId",
                table: "CartEntity",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CartEntity_tblProducts_ProductId",
                table: "CartEntity",
                column: "ProductId",
                principalTable: "tblProducts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
