const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { EmitFlags } = require('typescript');
require('dotenv').config(); 

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'images')));




const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});


//CONEXION A LA BASE DE DATOS
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'tiendaropa'
});
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']; // Revisa si el encabezado está configurado correctamente

  if (!token) {
    console.log('Token ausente en los encabezados');
    return res.status(401).send('Access Denied');
  }

  try {
    const verified = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'secret_key');
    console.log('Token verificado:', verified);
    req.user = verified;
    next();
  } catch (err) {
    console.error('Error al verificar el token:', err.message);
    res.status(401).send('Invalid Token');
  }
};


//FUNCIONES DE USUARIOS
app.get('/usuarios/profile',verificarToken,async (req, res) => {
  try {
    const [users] = await pool.promise().query(
      'SELECT id, name, email, telefono, direccion FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];
    res.json({ user });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
});
app.post('/usuarios/check-email', async(req, res) => {
  try{
  const { email } = req.body;
  
  const [rows] = await pool.promise().query(
    'SELECT COUNT(*) as count FROM users WHERE email = ?',
    [email]
  );

  res.json({ 
    exists: rows[0].count > 0,
    message: rows[0].count > 0 ? 'Email ya registrado' : 'Email disponible'
  });

} catch (error) {
  console.error('Error al verificar teléfono:', error);
  res.status(500).json({
    message: 'Error al verificar teléfono',
    error: error.message
  });
}

});
app.post('/usuarios/check-telefono', async (req, res) => {
  try {
    const { telefono } = req.body;

    const [rows] = await pool.promise().query(
      'SELECT COUNT(*) as count FROM users WHERE telefono = ?',
      [telefono]
    );

    res.json({ 
      exists: rows[0].count > 0,
      message: rows[0].count > 0 ? 'Teléfono ya registrado' : 'Teléfono disponible'
    });

  } catch (error) {
    console.error('Error al verificar teléfono:', error);
    res.status(500).json({
      message: 'Error al verificar teléfono',
      error: error.message
    });
  }
});
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.promise().query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    console.log('Usuario encontrado:', { ...user, password: '***' });

    const isPasswordMatch = await bcrypt.compare(password, user.password);
      
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const userRole = user.role || 'user';
    console.log('Role del usuario:', userRole);

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: userRole
      }, 
      process.env.JWT_SECRET || 'tu_clave_secreta', 
      { expiresIn: '24h' }
    );

    res.json({
      token,
      role: userRole,
      userId: user.id,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }

});
app.get('/usuarios/:id', async (req, res) => {
  try {
    const [usuario] = await pool.promise().query('SELECT id, name, email, telefono, direccion, password, role FROM users WHERE id = ?', [req.params.id]);

    if (usuario.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    res.json(usuario[0]);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);  
    res.status(500).json({
      success: false,
      message: 'Error al obtener el usuario',
      error: error.message || error 
    });
  }
});
app.post('/usuarios/registro', async (req, res) => {

  try {
    const { name, email, telefono, password, direccion, role } = req.body;

    if (!name || !email || !telefono || !password || !direccion) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.promise().query(
      'INSERT INTO users (name, email, telefono, password, direccion, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, telefono, hashedPassword, direccion, role || 'user']
    );

    console.log('Usuario registrado:', result);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      userId: result.insertId,
      redirectTo: '/login'
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
});
app.get('/usuarios', async (req, res) => {
  try {
    const [usuarios] = await pool.promise().query('SELECT id, name, email, telefono, direccion, role FROM users');
    
    res.json({
      success: true,
      usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener la lista de usuarios' 
    });
  }
});
app.delete('/usuarios/:id', (req, res) => {
  const id = req.params.id;

  pool.query('SELECT * FROM users WHERE id = ?', [id], (err, rows) => {
    if (err) {
      console.error('Error al buscar usuario:', err);
      return res.status(500).json({ success: false, error: 'Error al buscar usuario' });
    }

    if (rows.length === 0) {
      console.log('Usuario no encontrado con ID:', id);
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const query = 'DELETE FROM users WHERE id = ?';
    pool.query(query, [id], (err, result) => {
      if (err) {
        console.error('Error al eliminar usuario:', err);
        return res.status(500).json({ success: false, error: 'Error al eliminar usuario' });
      }
      console.log('Usuario eliminado correctamente');
      res.json({ success: true });
    });
  });
});
app.put('/usuarios/:id', async(req, res) => {
  const { id } = req.params;
  const { name, email, telefono, direccion, password } = req.body;

  try {
    let updateQuery = 'UPDATE users SET name = ?, email = ?, telefono = ?, direccion = ?';
    const queryParams = [name, email, telefono, direccion];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    const [results] = await pool.promise().query(updateQuery, queryParams);

    if (results.affectedRows === 0) {
      return res.status(404).send('Usuario no encontrado.');
    }

    res.status(200).send('Usuario actualizado exitosamente.');
  } catch (err) {
    console.error('Error en la consulta SQL:', err);
    res.status(500).send('Error al actualizar usuario.');
  }
});
app.post('/usuarios/registrar-admin', async (req, res) => {
  try {
    const { name, email, telefono, password, direccion, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleAdmin = 'admin';
    const [result] = await pool.promise().query(
      'INSERT INTO users (name, email, telefono, password, direccion, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, telefono, hashedPassword, direccion, roleAdmin || 'admin']
    );

    console.log('Admin registrado:', result);

    res.status(201).json({
      success: true,
      message: 'Admin registrado exitosamente',
      userId: result.insertId,
      redirectTo: '/login'
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar admin',
      error: error.message
    });
  }
});



//FUNCIONES DE PRODUCTOS


app.get('/productos', async (req, res) => {
  try {
      const [productos] = await pool.promise().query('SELECT * FROM clothing');

      const productosConTalles = await Promise.all(
          productos.map(async (producto) => {
              const [talles] = await pool.promise().query(
                  'SELECT size, stock FROM sizes WHERE clothing_id = ?',
                  [producto.id]
              );
              return { ...producto, talles };
          })
      );

      res.json(productosConTalles);
  } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
  });
  app.delete('/productos/:id', (req, res) => {
    const id = req.params.id;
    pool.query('SELECT * FROM clothing WHERE id = ?', [id], (err, rows) => {
      if (err) {
        console.error('Error al buscar producto:', err);
        return res.status(500).json({ success: false, error: 'Error al buscar producto' });
      }

      if (rows.length === 0) {
        console.log('Producto no encontrado con ID:', id);
        return res.status(404).json({ success: false, error: 'Producto no encontrado' });
      }

      const query = 'DELETE FROM clothing WHERE id = ?';
      pool.query(query, [id], (err, result) => {
        if (err) {
          console.error('Error al eliminar producto:', err);
          return res.status(500).json({ success: false, error: 'Error al eliminar producto' });
        }
        console.log('Producto eliminado correctamente');
        res.json({ success: true });
      });
    });
  });
  app.post('/productos/agregar', upload.single('imagen'), async (req, res) => {
    try {
      const { name, price, description, talles } = req.body;

      if (!name || !price || !description || !talles) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
      }

      const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

      // Inserta los datos en la base de datos
      const [result] = await pool.promise().query(
        'INSERT INTO clothing (name, description, price, imagen) VALUES (?, ?, ?, ?)',
        [name, description, price, imagenUrl]
      );

      const productoId = result.insertId;

      // Inserta los talles
      const tallesData = JSON.parse(talles).map(talle => [productoId, talle.size, talle.stock]);
      await pool.promise().query(
        'INSERT INTO sizes (clothing_id, size, stock) VALUES ?',
        [tallesData]
      );

      res.status(201).json({ message: 'Producto agregado con éxito.', productoId });
    } catch (error) {
      console.error('Error al agregar producto:', error);
      res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
  });


  app.put('/productos/:id', upload.single('imagen'), async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio } = req.body;
    
    // Verifica si la imagen fue subida
    if (req.file) {
      console.log('Archivo recibido:', req.file);
    } else {
      console.log('No se ha recibido archivo de imagen');
    }
  
    try {
      // Crear la consulta de actualización
      let updateQuery = 'UPDATE clothing SET name = ?, description = ?, price = ?';
      const queryParams = [nombre, descripcion, precio];
    
      // Verificar si se subió una nueva imagen
      if (req.file) {
        const nuevaImagen = `/uploads/${req.file.filename}`; // Asumimos que el archivo se guarda en la carpeta "uploads"
        updateQuery += ', imagen = ?'; // Agregar el campo de imagen a la consulta
        queryParams.push(nuevaImagen); // Añadir la ruta de la imagen a los parámetros de la consulta
      }
    
      // Agregar la cláusula WHERE para identificar el producto a actualizar
      updateQuery += ' WHERE id = ?';
      queryParams.push(id);
    
      // Ejecutar la consulta de actualización
      const [results] = await pool.promise().query(updateQuery, queryParams);
    
      // Verificar si el producto fue encontrado y actualizado
      if (results.affectedRows === 0) {
        return res.status(404).send({ error: 'Producto no encontrado o no hubo cambios' });
      }
    
      // Responder si la actualización fue exitosa
      res.status(200).send('Producto actualizado exitosamente.');
    
    } catch (err) {
      // Manejo de errores en la consulta SQL
      console.error('Error en la consulta SQL:', err);
      res.status(500).send({ error: 'Error al actualizar el producto.' });
    }
  });
  
  
  
  //IMAGENES
  app.get('/imagenes', (req, res) => {
    pool.query('SELECT * FROM imagenes', (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error al obtener las imagenes' });
        return;
      }
      res.json(results);
    });
  });
  //TEST
  app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando correctamente' });
  });

  //INICIO DEL SERVIDOR
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 3000}`);
  });
