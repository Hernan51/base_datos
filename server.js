const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

// Configuración de la conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'proyecto'
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
  } else {
    console.log('Conexión a la base de datos exitosa');
  }
});

// Configuración del middleware bodyParser para manejar datos JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.post('/agregar-metodo-pago', (req, res) => {
  const { fecha_pago, monto_pagar, tipo_pago } = req.body;

  const sql = 'INSERT INTO metodos_pago (fecha_pago, monto_pagar, tipo_pago) VALUES (?, ?, ?)';
  db.query(sql, [fecha_pago, monto_pagar, tipo_pago], (err, result) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      res.status(500).json({ error: 'Error al agregar método de pago' });
    } else {
      res.json({ success: true });
    }
  });
});

// Manejador para la ruta de registro de usuario
// Manejador para la ruta de registro de usuario
app.post('/registrar-usuario', (req, res) => {
  const { nombre, fechaNacimiento, direccion, telefono, correo } = req.body;

  const sqlCliente = 'INSERT INTO clientes (nombre_completo, fecha_nacimiento, direccion, numero_telefono, email) VALUES (?, ?, ?, ?, ?)';
  const sqlHistorialCliente = 'INSERT INTO historial_clientes (nombre_completo, fecha_registro) VALUES (?, NOW())';

  db.beginTransaction(err => {
    if (err) {
      console.error('Error al iniciar la transacción:', err);
      res.status(500).send('Error al registrar usuario');
      return;
    }

    db.query(sqlCliente, [nombre, fechaNacimiento, direccion, telefono, correo], (err, result) => {
      if (err) {
        console.error('Error al ejecutar la consulta para insertar cliente:', err);
        res.status(500).send('Error al registrar usuario');
        db.rollback(() => {
          throw err;
        });
      } else {
        console.log('Usuario registrado con éxito');

        // Insertar en historial_clientes
        db.query(sqlHistorialCliente, [nombre], (err, result) => {
          if (err) {
            console.error('Error al ejecutar la consulta para insertar en historial_clientes:', err);
            res.status(500).send('Error al registrar usuario');
            db.rollback(() => {
              throw err;
            });
          } else {
            console.log('Registro en historial_clientes realizado con éxito');
            db.commit(err => {
              if (err) {
                console.error('Error al hacer commit:', err);
                res.status(500).send('Error al registrar usuario');
                db.rollback(() => {
                  throw err;
                });
              } else {
                res.status(200).send('Usuario registrado y registrado en historial_clientes con éxito');
              }
            });
          }
        });
      }
    });
  });
});


// Ruta para verificar el correo
app.get('/verificar_correo', (req, res) => {
  const { email } = req.query;

  // Consulta SQL para verificar el correo en la tabla clientes
  const sql = `SELECT * FROM clientes WHERE email = ?`;
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error('Error al verificar el correo:', err);
      res.status(500).json({ valido: false });
    } else {
      res.json({ valido: result.length > 0 });
    }
  });
});

// Ruta para agregar modelo auto


// Ruta para actualizar un modelo de auto
app.put('/actualizar-modelo-auto/:id', (req, res) => {
  const { modelo, marca, caracteristicas, inventario } = req.body;
  const id = req.params.id;
  const sql = 'UPDATE modelo_auto SET modelo=?, marca=?, caracteristicas=?, inventario=? WHERE id=?';
  db.query(sql, [modelo, marca, caracteristicas, inventario, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar modelo de auto:', err);
      res.status(500).send('Error al actualizar modelo de auto');
    } else {
      res.status(200).send('Modelo de auto actualizado con éxito');
    }
  });
});

// Ruta para eliminar un modelo de auto
app.delete('/eliminar-modelo-auto/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM modelo_auto WHERE id=?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar modelo de auto:', err);
      res.status(500).send('Error al eliminar modelo de auto');
    } else {
      res.status(200).send('Modelo de auto eliminado con éxito');
    }
  });
});

app.get('/obtener-modelos-auto', (req, res) => {
  const sql = 'SELECT * FROM modelo_auto';

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      res.status(500).json({ error: 'Error al obtener modelos de auto' });
    } else {
      res.json(result);
    }
  });
});

// Ruta para obtener las sucursales
app.get('/obtenerSucursales', (req, res) => {
  const sql = 'SELECT id, direccion FROM sucursales';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error al obtener sucursales:', err);
      res.status(500).json([]);
    } else {
      res.json(result);
    }
  });
});

// Ruta para consultar el historial de mantenimiento basado en modelo de auto y sucursal
app.get('/consulta/historial', (req, res) => {
  const { modeloAuto, sucursal } = req.query;
  const sql = `
      SELECT hm.id_auto, ma.modelo_auto, ma.marca_auto, s.direccion AS direccion_sucursal
      FROM historial_mantenimiento hm
      INNER JOIN modelo_auto ma ON hm.id_auto = ma.id_auto
      INNER JOIN sucursales s ON hm.id_auto = s.id
      WHERE hm.id_auto = ? AND s.id = ?
    `;
  db.query(sql, [modeloAuto, sucursal], (err, result) => {
    if (err) {
      console.error('Error al consultar historial de mantenimiento:', err);
      res.status(500).json([]);
    } else {
      res.json(result);
    }
  });
});

app.get('/consultarCompras', (req, res) => {
  const { sucursal } = req.query;
  const sql = `
      SELECT c.nombre_completo, hc.fecha_compra, ps.tipo, ps.costo, s.direccion
      FROM historial_compras hc
      INNER JOIN clientes c ON hc.id_pedido = c.id_cliente
      INNER JOIN productos_servicios ps ON hc.id_productos_servicios = ps.id_sucursal
      INNER JOIN sucursales s ON ps.id_sucursal = s.id
      WHERE s.id = ?
    `;
  db.query(sql, [sucursal], (err, result) => {
    if (err) {
      console.error('Error al consultar compras por sucursal:', err);
      res.status(500).json([]);
    } else {
      res.json(result);
    }
  });
});

app.post('/agregar-modelo-auto', (req, res) => {
  const { modeloAuto, marcaAuto, caracteristicasAuto, inventarioAuto } = req.body;

  const sql = 'INSERT INTO modelo_auto (modelo_auto, marca_auto, caracteristicas_auto, inventario) VALUES (?, ?, ?, ?)';

  db.query(sql, [modeloAuto, marcaAuto, caracteristicasAuto, inventarioAuto], (err, result) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      res.status(500).send('Error al agregar modelo auto');
    } else {
      console.log('Modelo auto agregado con éxito');
      res.status(200).send('Modelo auto agregado con éxito');
    }
  });
});

app.post('/agregar-empleado', (req, res) => {
  const nuevoEmpleado = req.body;

  if (!nuevoEmpleado.nombre || !nuevoEmpleado.cargo || !nuevoEmpleado.fechaContratacion) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  // Realiza la inserción en la base de datos
  const query = 'INSERT INTO empleados (nombre, cargo, fecha_contratacion) VALUES (?, ?, ?)';
  db.query(query, [nuevoEmpleado.nombre, nuevoEmpleado.cargo, nuevoEmpleado.fechaContratacion], (err, result) => {
    if (err) {
      console.error('Error al insertar en la base de datos:', err);
      return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }

    console.log('Empleado agregado exitosamente a la base de datos');
    res.status(201).json({ mensaje: 'Empleado agregado exitosamente.' });
  });
});

// Agrega esta ruta para obtener todos los empleados
app.get('/obtener-empleados', (req, res) => {
  const query = 'SELECT * FROM empleados';

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error al obtener empleados de la base de datos:', err);
      return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }

    res.status(200).json(result);
  });
});

// Agrega esta ruta para obtener todos los proveedores
app.get('/obtener-proveedores', (req, res) => {
  const query = 'SELECT * FROM proveedores';

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error al obtener proveedores de la base de datos:', err);
      return res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }

    res.status(200).json(result);
  });
});

app.post('/agregar-proveedor', (req, res) => {
  const { nombre, contacto, id_productos_servicios } = req.body;

  // Realizar la inserción en la base de datos
  const sql = 'INSERT INTO proveedores (nombre, contacto, id_productos_servicios) VALUES (?, ?, ?)';
  db.query(sql, [nombre, contacto, id_productos_servicios], (err, result) => {
    if (err) {
      console.error('Error al agregar el proveedor a la base de datos:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    } else {
      console.log('Proveedor agregado exitosamente');
      res.json({ message: 'Proveedor agregado exitosamente' });
    }
  });
});


// Rutas para seguros
app.post('/agregar-seguro', (req, res) => {
  const { tipo_seguro, id_contratacion, id_auto, costo_seguro } = req.body;

  const query = 'INSERT INTO seguros (tipo_seguro, id_contratacion, id_auto, costo_seguro) VALUES (?, ?, ?, ?)';
  db.query(query, [tipo_seguro, id_contratacion, id_auto, costo_seguro], (err, result) => {
    if (err) {
      console.error('Error al agregar seguro:', err);
      res.status(500).send('Error interno del servidor');
    } else {
      console.log('Seguro agregado con éxito');
      res.status(200).send('Seguro agregado con éxito');
    }
  });
});




app.get('/obtener-seguros', (req, res) => {
  const query = 'SELECT * FROM seguros';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener seguros:', err);
      res.status(500).send('Error interno del servidor');
    } else {
      console.log('Seguros obtenidos con éxito');
      res.json(results);
    }
  });
});

app.get('/informeVentasPorMarcaModelo', (req, res) => {
  const query = `
    SELECT marca_auto, modelo_auto, SUM(precio) AS total
    FROM historial_compras
    GROUP BY marca_auto, modelo_auto
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error al obtener el informe de ventas:', err);
      res.status(500).send('Error al obtener el informe de ventas');
    } else {
      res.json(result);
    }
  });
});

app.get('/llamarProcedimiento', (req, res) => {
  const autoId = req.query.autoId;

  if (!autoId || isNaN(autoId)) {
    res.status(400).send('Por favor, proporciona un ID de auto válido');
    return;
  }

  const query = `CALL historialServiciosPorAuto(${autoId})`;

  db.query(query, (error, results, fields) => {
    if (error) {
      console.error('Error al llamar al procedimiento almacenado:', error);
      res.status(500).send('Error al llamar al procedimiento almacenado');
    } else {
      console.log('Resultado del procedimiento almacenado:', results);
      res.json(results);
    }
  });
});

app.delete('/eliminar-dato/:idContratacion', (req, res) => {
  const idContratacion = req.params.idContratacion;

  // Crear la consulta SQL para eliminar el registro específico
  const sql = `DELETE FROM seguros WHERE id_contratacion = ?`;

  // Ejecutar la consulta SQL con el parámetro
  db.query(sql, [idContratacion], (err, result) => {
    if (err) {
      console.error('Error al eliminar el dato:', err);
      res.status(500).send('Error interno del servidor');
      return;
    }

    console.log('Dato eliminado con éxito');
    res.send('Dato eliminado con éxito');
  });
});


app.get('/modelos', (req, res) => {
  // Consulta para recuperar datos de la tabla modelo_auto
  const sql = 'SELECT * FROM modelo_auto';
  connection.query(sql, (queryErr, results) => {
    if (queryErr) {
      console.error('Error al ejecutar la consulta:', queryErr);
      res.status(500).send('Error interno del servidor');
      return;
    }

    // Enviar resultados como respuesta
    res.json(results);
  });
});


// Agrega rutas adicionales para obtener datos de otras tablas según sea necesario


app.use(express.static('public'));


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});


process.on('SIGINT', () => {
  connection.end();
  process.exit();
});