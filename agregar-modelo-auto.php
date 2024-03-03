<!-- procesar_formulario.php -->
<?php
// Conexión a la base de datos
$conexion = new mysqli('localhost', 'root', '', 'proyecto');

// Verifica la conexión
if ($conexion->connect_error) {
    die("Error de conexión a la base de datos: " . $conexion->connect_error);
}

// Recupera los datos del formulario
$nombreModelo = $_POST['modelo_auto'];
$marcaModelo = $_POST['marca_auto'];
$caracteristicasModelo = $_POST['caracteristicas_auto'];
$inventarioModelo = $_POST['inventario_auto'];

// Consulta SQL para insertar datos en la base de datos
$sql = "INSERT INTO modelo_auto (modelo_auto, marca_auto, caracteristicas_auto, inventario) VALUES ('$nombreModelo', '$marcaModelo', '$caracteristicasModelo', '$inventarioModelo')";

// Ejecuta la consulta
if ($conexion->query($sql) === TRUE) {
    echo "Registro exitoso";
} else {
    echo "Error al registrar: " . $conexion->error;
}

// Cierra la conexión
$conexion->close();
?>
