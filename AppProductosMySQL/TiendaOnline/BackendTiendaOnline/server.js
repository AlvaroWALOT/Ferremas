const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express()
const PORT = 3006
app.use(cors())

const DB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'tienda',
});

DB.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conexion exitosa !! ');
});

app.get('/api/productos', (req, res) => {
    const SQL_QUERY = 'SELECT * FROM productos'
    DB.query(SQL_QUERY, (err, result) => {
        if (err) {
            throw err
        }
        res.json(result);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
})