import { useEffect, useState } from "react";


function App() {
  const [productos, setProductos] = useState([]);

  const fetchProductos = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/productos')
      if (!response.ok) {
        throw new Error('Error al obtener los datos del servidor !! ')
      }

      const data = await response.json()
      setProductos(data)
    } catch (error) {
      console.log('Error al obtener productos !! ');
    }
  };

  useEffect(() => {
    fetchProductos();

  }, [])

  return (
    <div className='container m-5'>
      <h1>Tienda Online</h1>
      <hr />
      <div className='row'>
        {productos.map((p) => (
          <div className='col-md-4 mb-4' key={p.id}>
            <div className='card h-100'>
              {/* Contenedor de la imagen con tamaño fijo */}
              <div className='card-img-container' style={{ height: '200px', overflow: 'hidden' }}>
                <img
                  src={`/images/${p.imagen}`} // Asegúrate que las imágenes estén en tu carpeta public/images
                  alt={p.nombre}
                  className='card-img-top img-fluid h-100'
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div className='card-body'>
                <h3 className='card-title'>{p.nombre}</h3>
                <h5 className='card-subtitle text-muted'>{p.marca}</h5>
                <p className='card-text'>{p.descripcion}</p>

                <div className='d-flex justify-content-between align-items-center'>
                  <span className='badge bg-primary'>{p.codigo_producto}</span>
                  <span className='text-success fw-bold'>${p.precio.toLocaleString()}</span>
                </div>

                <div className='mt-2'>
                  <span className={`badge ${p.cantidad > 0 ? 'bg-success' : 'bg-danger'}`}>
                    {p.cantidad > 0 ? `Stock: ${p.cantidad}` : 'Agotado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
