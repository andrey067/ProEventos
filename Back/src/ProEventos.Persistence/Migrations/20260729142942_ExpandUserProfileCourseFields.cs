using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProEventos.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ExpandUserProfileCourseFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Funcao",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "NaoInformado");

            migrationBuilder.AddColumn<string>(
                name: "ImagemURL",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimeiroNome",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Titulo",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "NaoInformado");

            migrationBuilder.AddColumn<string>(
                name: "UltimoNome",
                table: "AspNetUsers",
                type: "TEXT",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Funcao",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ImagemURL",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PrimeiroNome",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Titulo",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UltimoNome",
                table: "AspNetUsers");
        }
    }
}
