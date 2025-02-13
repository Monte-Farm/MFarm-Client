import React, { useState } from "react";
import { Input, Table } from "reactstrap";
import SimpleBar from "simplebar-react";

interface OrderProductsTableProps {
  data: any[];
  productsDelivered: Array<{ id: string; quantity: number | "" }>;
  onProductEdit: (updatedProducts: Array<{ id: string; quantity: number }>) => void;
}

const OrderTable: React.FC<OrderProductsTableProps> = ({ data, productsDelivered, onProductEdit }) => {
  const [filterText, setFilterText] = useState<string>("");

  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const handleInputChange = (id: string, value: string) => {
    let cleanedValue = value.replace(/^0+/, ""); // Elimina ceros iniciales

    if (cleanedValue === "") cleanedValue = "0"; // Si el usuario borra todo, queda "0"

    let parsedValue = parseInt(cleanedValue, 10);
    if (isNaN(parsedValue)) parsedValue = 0;

    const product = data.find((p) => p.id === id);
    const maxQuantity = product?.quantity || 0;

    // Limitar el valor en tiempo real
    if (parsedValue > maxQuantity) {
      parsedValue = maxQuantity;
    }

    // Actualiza el estado del input
    setEditingValues((prev) => ({ ...prev, [id]: parsedValue.toString() }));

    // Actualiza la lista de productos entregados
    const updatedProducts = productsDelivered.map((p) =>
      p.id === id ? { ...p, quantity: parsedValue } : p
    );
    onProductEdit(updatedProducts as Array<{ id: string; quantity: number }>);
  };

  const getInputValue = (id: string) => {
    if (editingValues[id] !== undefined) return editingValues[id];
    return productsDelivered.find((p) => p.id === id)?.quantity.toString() || "0";
  };

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
        />
      </div>

      <SimpleBar style={{ height: "500px" }}>
        <Table className="table-hover align-middle table-nowrap mb-0" striped>
          <thead className="table-light sticky-top">
            <tr>
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
                const deliveredProduct = productsDelivered.find((p) => p.id === product.id);
                return (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.quantity}</td>
                    <td>
                      <Input
                        type="number"
                        value={editingValues[product.id] ?? productsDelivered.find((p) => p.id === product.id)?.quantity.toString() ?? "0"}
                        onChange={(e) => handleInputChange(product.id, e.target.value)}
                        min={0}
                        max={product.quantity}
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
