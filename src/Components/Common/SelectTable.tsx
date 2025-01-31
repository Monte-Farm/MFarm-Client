import React, { useEffect, useState, useCallback } from "react";
import { Input, Table } from "reactstrap";
import Pagination from "./Pagination";

interface SelectTableProps {
  data: any[];
  onProductSelect: (
    selectedProducts: Array<{ id: string; quantity: number; price: number }>
  ) => void;
  showStock?: boolean;
}

const SelectTable: React.FC<SelectTableProps> = ({ data, onProductSelect, showStock = false }) => {
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ id: string; quantity: number; price: number }>
  >([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>("");
  const rowsPerPage = 5;

  const handleInputChange = useCallback(
    (id: string, field: "quantity" | "price", value: number) => {
      const product = data.find((p) => p.id === id);
      const maxQuantity = product?.quantity ?? Infinity; // Si no hay stock definido, no se limita

      const updatedProducts = selectedProducts.map((p) =>
        p.id === id
          ? {
            ...p,
            [field]:
              field === "quantity" && showStock
                ? Math.min(isNaN(value) ? 0 : value, maxQuantity) // Limitar la cantidad al stock disponible
                : isNaN(value) ? 0 : value,
          }
          : p
      );
      setSelectedProducts(updatedProducts);
      onProductSelect(updatedProducts);
    },
    [selectedProducts, onProductSelect, data, showStock]
  );

  const handleCheckboxChange = useCallback((id: string, checked: boolean) => {
    if (checked) {
      if (showStock) {
        const product = data.find((p) => p.id === id)
        setSelectedProducts((prev) => [...prev, { id, quantity: 0, price: parseFloat(product.averagePrice.toFixed(2)) }]);
      } else {
        setSelectedProducts((prev) => [...prev, { id, quantity: 0, price: 0 }]);
      }
    } else {
      setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
    }
  }, [data, showStock]);

  const handleRowClick = useCallback((id: string) => {
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
            {showStock && <th>Existencias</th>} {/* Mostrar la columna de existencias si showStock es true */}
            <th>Cantidad</th>
            <th>Unidad de medida</th>
            {showStock ? <th>Precio Promedio</th> : <th>Precio Unitario</th>} {/* Cambiar el encabezado */}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((product) => {
              const isSelected = selectedProducts.some((p) => p.id === product.id);
              return (
                <tr
                  key={product.id}
                  onClick={() => handleRowClick(product.id)}
                  style={{ cursor: "pointer" }}
                >
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
                  {showStock && <td>{product.quantity}</td>} {/* Mostrar existencias */}
                  <td>
                    <Input
                      type="number"
                      value={
                        selectedProducts.find((p) => p.id === product.id)?.quantity || ""
                      }
                      onChange={(e) =>
                        handleInputChange(product.id, "quantity", parseInt(e.target.value, 10))
                      }
                      disabled={!isSelected}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>{product.unit_measurement}</td>
                  {showStock ? (
                    <td>${product.averagePrice.toFixed(2)}</td>
                  ) : (
                    <td>
                      <Input
                        type="number"
                        value={
                          selectedProducts.find((p) => p.id === product.id)?.price || ""
                        }
                        onChange={(e) =>
                          handleInputChange(product.id, "price", parseFloat(e.target.value))
                        }
                        disabled={!isSelected}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={showStock ? 8: 7} className="text-center">
                No hay productos disponibles.
              </td>
            </tr>
          )}
        </tbody>

      </Table>

      <div className="mt-3">
        <Pagination
          data={filteredData}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          perPageData={rowsPerPage}
        />
      </div>
    </div>
  );
};

export default SelectTable;
