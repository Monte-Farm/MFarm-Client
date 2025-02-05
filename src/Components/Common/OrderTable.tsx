import React, { useEffect, useState, useCallback } from "react";
import { Input, Table } from "reactstrap";
import SimpleBar from "simplebar-react";

interface OrderProductsTableProps {
  data: any[];
  onProductSelect: (selectedProducts: Array<{ id: string; quantity: number, price: number }>) => void;
  fixedColumnNames?: boolean; // Prop para hacer los nombres de las columnas fijos
}

const OrderTable: React.FC<OrderProductsTableProps> = ({
  data,
  onProductSelect,
  fixedColumnNames
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Array<{ id: string; quantity: number; price: number }>>([]);
  const [filterText, setFilterText] = useState<string>("");

  const handleInputChange = useCallback(
    (id: string, value: number) => {
      const product = data.find((p) => p.id === id);
      const maxQuantity = product?.quantity || 0;
      const updatedQuantity = Math.min(isNaN(value) ? 0 : value, maxQuantity);

      const updatedProducts = selectedProducts.map((p) =>
        p.id === id ? { ...p, quantity: updatedQuantity, price: product?.price || p.price } : p
      );
      setSelectedProducts(updatedProducts);
      onProductSelect(updatedProducts);
    },
    [selectedProducts, onProductSelect, data]
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

      {/* Contenedor con desplazamiento cuando no hay paginación */}
      <SimpleBar style={{ height: "500px" }}>
        <Table className="table-hover align-middle table-nowrap mb-0" striped>
          <thead className="table-light sticky-top">
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
            {filteredData.length > 0 ? (
              filteredData.map((product) => {
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
      </SimpleBar>
    </div>
  );
};

export default OrderTable;
