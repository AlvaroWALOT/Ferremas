import { useEffect, useState } from "react";

function App() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [currency, setCurrency] = useState("CLP");

  // Tipo de cambio fijo temporal
  const [exchangeRate, setExchangeRate] = useState(950);
  const [loadingRate, setLoadingRate] = useState(false);

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

  // ------------------------------
  // FUNCION PARA USAR LA API DEL BANCO CENTRAL
  // Cuando tu cuenta esté habilitada, descomenta este bloque:
  /*
  const fetchExchangeRate = async () => {
    setLoadingRate(true);

    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 7);

    const formatDate = (date) =>
      date.toISOString().split("T")[0];

    const firstDate = formatDate(pastDate);
    const lastDate = formatDate(today);

    const url = `http://localhost:3006/api/tipo-cambio`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (
        data.Series &&
        data.Series[0] &&
        data.Series[0].Obs &&
        data.Series[0].Obs.length > 0
      ) {
        const latestValue = parseFloat(
          data.Series[0].Obs[data.Series[0].Obs.length - 1].value
        );

        setExchangeRate(latestValue);
      } else {
        console.error("No se encontraron datos de tipo de cambio");
        setExchangeRate(null);
      }
    } catch (error) {
      console.error("Error obteniendo tipo de cambio:", error);
      setExchangeRate(null);
    } finally {
      setLoadingRate(false);
    }
  };
  */
  // ------------------------------

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
            precio: Math.round(p.precio),
          })),
        }),
      });

      const data = await response.json();
      if (data.url && data.token) {
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
    // Si tu API está lista, descomenta esta línea:
    // fetchExchangeRate();
  }, []);

  return (
    <div className="container m-5">
      <h1>FERREMAS</h1>
      <hr />

      {/* Selector de moneda */}
      <div className="mb-3">
        <label htmlFor="currency-select" className="form-label">Moneda:</label>
        <select
          id="currency-select"
          className="form-select w-auto d-inline-block ms-2"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="CLP">CLP (Pesos Chilenos)</option>
          <option value="USD">USD (Dólares)</option>
        </select>

        {currency === "USD" && (
          <span className="ms-3">
            {loadingRate && "Cargando tipo de cambio..."}
            {!loadingRate && exchangeRate && (
              <>Tipo de cambio: 1 USD = {exchangeRate} CLP</>
            )}
            {!loadingRate && !exchangeRate && (
              <span className="text-danger">Error obteniendo tipo de cambio</span>
            )}
          </span>
        )}
      </div>

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
                    {currency === "CLP" &&
                      `$${Math.round(p.precio).toLocaleString('es-CL')}`}
                    {currency === "USD" &&
                      (exchangeRate
                        ? `US$${(p.precio / exchangeRate).toFixed(2)}`
                        : "N/D")}
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
                {item.nombre} x {item.cantidad} -{" "}
                {currency === "CLP" &&
                  `$${Math.round(item.precio).toLocaleString('es-CL')}`}
                {currency === "USD" &&
                  (exchangeRate
                    ? `US$${(item.precio / exchangeRate).toFixed(2)}`
                    : "N/D")}
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
