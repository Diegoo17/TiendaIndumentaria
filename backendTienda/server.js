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
require('dotenv').config(); 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 



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
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send('Access Denied');
  }
  try {
    const verified = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'secret_key'); 
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

//FUNCIONES DE USUARIOS
app.get('/usuarios/profile', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
      return res.status(401).send('Access Denied');
  }
  try {
      const bearerToken = token.split(' ')[1];
      if (!bearerToken) {
          return res.status(401).send('Access Denied');
      }
      const verified = jwt.verify(bearerToken, process.env.JWT_SECRET || 'secret_key');
      const userId = verified.id; 
      connection.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
          if (err) {
              return res.status(500).send('Server error');
          }

          if (results.length === 0) {
              return res.status(404).send('User not found');
          }
          res.json(results[0]);
      });

  } catch (err) {
      res.status(400).send('Invalid Token');
  }
});
app.post('/usuarios/check-email', (req, res) => {
  const { email } = req.body;
  console.log('Verificando email:', email);
  
  const query = 'SELECT * FROM users WHERE email = ?';
  pool.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error al verificar email:', err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }
    return res.json({ 
      isEmailTaken: results.length > 0,
      message: results.length > 0 ? 'Email ya registrado' : 'Email disponible'
    });
  });
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

    if (password !== user.password) {
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
app.put('/usuarios/profile', verificarToken, async (req, res) => {
  const { nombre, email, telefono, direccion } = req.body;

  try {
    await pool.promise().query(
      'UPDATE users SET name = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?',
      [nombre, email, telefono, direccion, req.user.userId]
    );

    const [updatedUser] = await pool.promise().query(
      'SELECT id, nombre, email, telefono, direccion FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});
app.post('/usuarios/check-telefono', async (req, res) => {
  try {
    console.log('Verificando teléfono:', req.body);
    const { telefono } = req.body;

    if (!telefono) {
      return res.status(400).json({ 
        message: 'El teléfono es requerido' 
      });
    }

    const [rows] = await pool.promise().query(
      'SELECT COUNT(*) as count FROM users WHERE telefono = ?',
      [telefono]
    );

    console.log('Resultado de la consulta:', rows);

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
app.post('/usuarios/registro', async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    const { nombre, email, telefono, password, direccion, role } = req.body;

    if (!nombre || !email || !telefono || !password || !direccion) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    const [result] = await pool.promise().query(
      'INSERT INTO users (name, email, telefono, password, direccion, role) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, email, telefono, password, direccion, role || 'user']
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



//FUNCIONES DE PRODUCTOS
app.get('/productos', (req, res) => {
  pool.query('SELECT * FROM clothing', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error al obtener productos' });
      return;
    }
    res.json(results);
  });
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
app.post('/productos/agregar', upload.single('imagen'), (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    
    const { name, price, description } = req.body;
    let imagen = null;
    if (req.file) {
      imagen = `/uploads/${req.file.filename}`;
      console.log('Archivo guardado:', imagen);
    }
    const query = 'INSERT INTO clothing (name, price, description, imagen) VALUES (?, ?, ?, ?)';
    
    pool.query(query, [name, price, description, imagen], (error, result) => {
      if (error) {
        console.error('Error SQL:', error);
        return res.status(500).json({
          error: 'Error al insertar en la base de datos',
          details: error.message
        });
      }
      res.status(201).json({
        message: 'Producto agregado correctamente',
        producto: {
          id: result.insertId,
          name,
          price,
          description,
          imagen
        }
      });
    });

  } catch (error) {
    console.error('Error general:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});



//TEST
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

//INICIO DEL SERVIDOR
app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT || 3000}`);
});
