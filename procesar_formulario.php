<?php
// Verificar si el formulario se envió
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Recuperar datos del formulario
    $modelo = $_POST["modelo-auto"];
    $marca = $_POST["marca-auto"];
    $caracteristicas = $_POST["caracteristicas-auto"];
    $inventario = $_POST["inventario-auto"];

    // Conectar a la base de datos (ajusta las credenciales según tu configuración)
    $conexion = new mysqli("localhost", "root", "", "proyecto");

    // Verificar la conexión
    if ($conexion->connect_error) {
        die("Conexión fallida: " . $conexion->connect_error);
    }

    // Preparar la consulta SQL para insertar datos en la tabla modelo_auto
    $consulta = $conexion->prepare("INSERT INTO modelo_auto (modelo_auto, marca_auto, caracteristicas_auto, inventario) VALUES (?, ?, ?, ?)");
    $consulta->bind_param("sssi", $modelo, $marca, $caracteristicas, $inventario);

    // Ejecutar la consulta
    if ($consulta->execute()) {
        echo "Registro exitoso";
    } else {
        echo "Error al registrar: " . $conexion->error;
    }

    // Cerrar la conexión y la consulta
    $consulta->close();
    $conexion->close();
}
?>
