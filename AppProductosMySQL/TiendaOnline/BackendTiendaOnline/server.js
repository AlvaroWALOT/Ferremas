const express = require('express');
const mysql = require('mysql');

const app = express()
const PORT = 3006

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