const { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } = require('transbank-sdk');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 3006;
app.use(cors());
app.use(express.json());

// Configuración completa de la base de datos
const DB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'tienda',
    port: 3306 // El puerto por defecto de MySQL
});

// Manejo de errores de conexión a MySQL
DB.connect((err) => {
    if (err) {
        console.error('Error de conexión a MySQL:', err);
        process.exit(1); // Termina la aplicación si no puede conectarse a la base de datos
    }
    console.log('Conectado a la base de datos MySQL');
});

// Endpoint para obtener productos (modificado)
app.get('/api/productos', (req, res) => {
    const SQL_QUERY = 'SELECT id, codigo_producto, categoria_id, marca, nombre, descripcion, ROUND(precio, 0) as precio, cantidad, imagen, fecha_actualizacion FROM productos';
    DB.query(SQL_QUERY, (err, result) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).json({ error: 'Error al obtener productos' });
        }
        res.json(result);
    });
});

// Endpoint para obtener el tipo de cambio desde el Banco Central
app.get('/api/tipo-cambio', async (req, res) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 7);

    const formatDate = (date) => date.toISOString().split("T")[0];
    const firstDate = formatDate(pastDate);
    const lastDate = formatDate(today);

    const url = `https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx?user=alv.castroc@duocuc.cl&pass=Puchacabros13&function=GetSeries&series=F073.TCO.PRE.Z.D&firstDate=${firstDate}&lastDate=${lastDate}&type=json`;

    try {
        const fetchResponse = await fetch(url);
        const data = await fetchResponse.json();

        // 🚨 Aquí logeamos la respuesta cruda
        console.log("Respuesta cruda del Banco Central:", JSON.stringify(data, null, 2));

        res.json(data);
    } catch (error) {
        console.error("Error obteniendo tipo de cambio:", error);
        res.status(500).json({ error: "Error obteniendo tipo de cambio" });
    }
});



// Endpoint para pagar 
app.post('/api/pagar', async (req, res) => {
    const carrito = req.body.carrito;

    if (!carrito || carrito.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío.' });
    }

    try {
        // Calcular el total del carrito y redondearlo
        const total = Math.round(carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0));

        // Verificar que el total sea mayor que 0
        if (total <= 0) {
            return res.status(400).json({ error: 'El monto total debe ser mayor que 0.' });
        }

        const buyOrder = 'ORD' + Date.now();
        const sessionId = 'SESS' + Date.now();
        const returnUrl = 'http://localhost:3006/api/pago/respuesta';

        // Configuración de Webpay
        const tx = new WebpayPlus.Transaction(
            new Options(
                IntegrationCommerceCodes.WEBPAY_PLUS,
                IntegrationApiKeys.WEBPAY,
                Environment.Integration
            )
        );

        const response = await tx.create(
            buyOrder,
            sessionId,
            total, // Este total ya está redondeado
            returnUrl
        );

        console.log('Respuesta de Webpay:', response);
        res.json(response);

    } catch (err) {
        console.error('Error en transacción:', err);
        res.status(500).json({
            error: 'Error al iniciar la transacción',
            details: err.message
        });
    }
});

// Endpoint para obtener un producto específico por ID
app.get('/api/productos/:id', (req, res) => {
    const productId = req.params.id;
    const SQL_QUERY = 'SELECT * FROM productos WHERE id = ?';

    DB.query(SQL_QUERY, [productId], (err, result) => {
        if (err) {
            console.error('Error al obtener producto:', err);
            return res.status(500).json({ error: 'Error al obtener producto' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result[0]);
    });
});

// Endpoint para manejar la respuesta de Webpay (GET y POST)
app.all('/api/pago/respuesta', async (req, res) => {
    try {
        const token = req.query.token_ws || req.body.token_ws;

        if (!token) {
            return res.status(400).send(`
                <html>
                    <body>
                        <h1>Error</h1>
                        <p>Token no proporcionado.</p>
                        <button onclick="window.close()">Cerrar ventana</button>
                    </body>
                </html>
            `);
        }

        const tx = new WebpayPlus.Transaction(
            new Options(
                IntegrationCommerceCodes.WEBPAY_PLUS,
                IntegrationApiKeys.WEBPAY,
                Environment.Integration
            )
        );

        const response = await tx.commit(token);

        // Guardar en DB (opcional)
        const sql = 'INSERT INTO transacciones (token, status, response) VALUES (?, ?, ?)';
        DB.query(sql, [token, response.status, JSON.stringify(response)], (err) => {
            if (err) console.error("Error al guardar transacción:", err);
        });

        // Página de éxito (si el pago fue autorizado)
        if (response.status === "AUTHORIZED") {
            return res.send(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Pago exitoso</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            .success { color: green; }
                            button { padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; }
                        </style>
                    </head>
                    <body>
                        <h1 class="success">¡Pago exitoso!</h1>
                        <p>Transacción autorizada. Esta ventana se cerrará automáticamente.</p>
                        <script>
                            window.opener.postMessage({ 
                                webpayStatus: 'success', 
                                token: '${token}',
                                response: ${JSON.stringify(response)}
                            }, '*');
                            setTimeout(() => window.close(), 2000);
                        </script>
                    </body>
                </html>
            `);
        }
        // Página de rechazo (si el pago falló)
        else {
            return res.send(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Pago rechazado</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            .error { color: red; }
                            button { padding: 10px 20px; background: #f44336; color: white; border: none; cursor: pointer; }
                        </style>
                    </head>
                    <body>
                        <h1 class="error">Pago rechazado</h1>
                        <p>Estado: ${response.status}</p>
                        <button onclick="window.close()">Cerrar ventana</button>
                        <script>
                            window.opener.postMessage({ 
                                webpayStatus: 'failure', 
                                token: '${token}',
                                response: ${JSON.stringify(response)}
                            }, '*');
                        </script>
                    </body>
                </html>
            `);
        }

    } catch (err) {
        console.error("Error confirmando transacción:", err);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Error en el pago</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    </style>
                </head>
                <body>
                    <h1>Error en el proceso de pago</h1>
                    <p>${err.message}</p>
                    <button onclick="window.close()">Cerrar ventana</button>
                </body>
            </html>
        `);
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});