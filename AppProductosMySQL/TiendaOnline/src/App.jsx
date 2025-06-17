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

  return (<div className='container m-5'>
    <h1>Tienda Online</h1>
    <hr />
  </div>
  );
}

export default App;
