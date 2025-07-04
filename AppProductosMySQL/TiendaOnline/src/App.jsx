import { useEffect, useState } from "react";

function App() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  const fetchProductos = async () => {
    try {
      const response = await fetch("http://localhost:3006/api/productos");
      if (!response.ok) {
        throw new Error("Error al obtener los datos del servidor!!");
      }

      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.log("Error al obtener productos!!");
    }
  };

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  };

  const iniciarPago = async () => {
    try {
      const response = await fetch("http://localhost:3006/api/pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrito: carrito.map((p) => ({
            id: p.id,
            cantidad: p.cantidad,
            precio: p.precio,
          })),
        }),
      });

      const data = await response.json();
      if (data.url && data.token) {
        // Redirigir a Webpay
        window.location.href = `${data.url}?token_ws=${data.token}`;
      } else {
        alert("Error iniciando pago: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error en el pago:", err);
      alert("Ocurrió un error al iniciar el pago.");
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  return (
    <div className="container m-5">
      <h1>Tienda Online</h1>
      <hr />
      <div className="row">
        {productos.map((p) => (
          <div className="col-md-4 mb-4" key={p.id}>
            <div className="card h-100">
              <div
                className="card-img-container"
                style={{ height: "200px", overflow: "hidden" }}
              >
                <img
                  src={`/images/${p.imagen}`}
                  alt={p.nombre}
                  className="card-img-top img-fluid h-100"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="card-body">
                <h3 className="card-title">{p.nombre}</h3>
                <h5 className="card-subtitle text-muted">{p.marca}</h5>
                <p className="card-text">{p.descripcion}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="badge bg-primary">{p.codigo_producto}</span>
                  <span className="text-success fw-bold">
                    ${p.precio.toLocaleString()}
                  </span>
                </div>
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => agregarAlCarrito(p)}
                >
                  Agregar al carrito
                </button>
                <div className="mt-2">
                  <span
                    className={`badge ${p.cantidad > 0 ? "bg-success" : "bg-danger"
                      }`}
                  >
                    {p.cantidad > 0 ? `Stock: ${p.cantidad}` : "Agotado"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {carrito.length > 0 && (
        <>
          <h2>Carrito</h2>
          <ul>
            {carrito.map((item) => (
              <li key={item.id}>
                {item.nombre} x {item.cantidad}
              </li>
            ))}
          </ul>
          <button className="btn btn-success" onClick={iniciarPago}>
            Pagar ahora
          </button>
        </>
      )}
    </div>
  );
}

export default App;
