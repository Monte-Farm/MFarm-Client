import React, { useEffect, useState, useCallback } from "react";
import { Input, Table } from "reactstrap";
import Pagination from "./Pagination";

interface OrderProductsTableProps {
  data: any[];
  onProductSelect: (selectedProducts: Array<{ id: string; quantity: number, price: number }>) => void;
}

const OrderTable: React.FC<OrderProductsTableProps> = ({ data, onProductSelect }) => {
  const [selectedProducts, setSelectedProducts] = useState<Array<{ id: string; quantity: number; price: number }>>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>("");
  const rowsPerPage = 5;

  const handleInputChange = useCallback(
    (id: string, value: number) => {
      const product = data.find((p) => p.id === id); // Encuentra el producto correspondiente
      const maxQuantity = product?.quantity || 0; // Obtén la cantidad máxima disponible
  
      // Asegúrate de que el valor no supere la cantidad máxima
      const updatedQuantity = Math.min(isNaN(value) ? 0 : value, maxQuantity);
  
      const updatedProducts = selectedProducts.map((p) =>
        p.id === id ? { ...p, quantity: updatedQuantity, price: product?.price || p.price } : p
      );
      setSelectedProducts(updatedProducts);
      onProductSelect(updatedProducts);
    },
    [selectedProducts, onProductSelect, data] // Asegúrate de incluir 'data' en las dependencias
  );
  

  const handleCheckboxChange = useCallback((id: string, checked: boolean) => {
    if (checked) {
      const product = data.find((p) => p.id === id);
      const price = product?.price || 0;
      setSelectedProducts((prev) => [...prev, { id, quantity: 0, price }]);
    } else {
      setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
    }
  }, []);

  const handleRowClick = useCallback(
    (id: string) => {
      const isSelected = selectedProducts.some((product) => product.id === id);
      handleCheckboxChange(id, !isSelected);
    },
    [selectedProducts, handleCheckboxChange]
  );

  const filteredData = data.filter((product) => {
    const filter = filterText.toLowerCase();
    return (
      product.id.toLowerCase().includes(filter) ||
      product.name.toLowerCase().includes(filter) ||
      product.category.toLowerCase().includes(filter) ||
      product.unit_measurement.toLowerCase().includes(filter)
    );
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  return (
    <div className="table-responsive">
      <div className="d-flex justify-content-between mb-3">
        <Input
          type="text"
          placeholder="Buscar por Producto, Categoría o Unidad de medida..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          aria-label="Buscar productos"
        />
      </div>

      <Table className="table-hover align-middle table-nowrap mb-0" striped>
        <thead className="table-light">
          <tr>
            <th>Seleccionar</th>
            <th>Código</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Cantidad Solicitada</th>
            <th>Cantidad Entregada</th>
            <th>Unidad de Medida</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((product) => {
              const isSelected = selectedProducts.some((p) => p.id === product.id);
              return (
                <tr key={product.id} onClick={() => handleRowClick(product.id)} style={{ cursor: "pointer" }}>
                  <td>
                    <Input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleCheckboxChange(product.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Seleccionar producto ${product.name}`}
                    />
                  </td>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.quantity}</td>
                  <td>
                    <Input
                      type="number"
                      value={selectedProducts.find((p) => p.id === product.id)?.quantity || ""}
                      onChange={(e) => handleInputChange(product.id, parseInt(e.target.value, 10))}
                      disabled={!isSelected}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>{product.unit_measurement}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="text-center">
                No hay productos disponibles.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="mt-3">
        <Pagination data={filteredData} currentPage={currentPage} setCurrentPage={setCurrentPage} perPageData={rowsPerPage} />
      </div>
    </div>
  );
};

export default OrderTable;
