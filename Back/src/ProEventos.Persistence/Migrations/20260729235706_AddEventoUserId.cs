using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProEventos.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEventoUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Eventos",
                type: "TEXT",
                maxLength: 450,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Eventos_UserId",
                table: "Eventos",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Eventos_AspNetUsers_UserId",
                table: "Eventos",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Eventos_AspNetUsers_UserId",
                table: "Eventos");

            migrationBuilder.DropIndex(
                name: "IX_Eventos_UserId",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Eventos");
        }
    }
}
