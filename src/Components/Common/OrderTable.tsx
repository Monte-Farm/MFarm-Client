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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const handleInputChange = (id: string, value: string) => {
    let cleanedValue = value.replace(/^0+/, ""); // Elimina ceros iniciales

    if (cleanedValue === "") cleanedValue = "0"; // Si el usuario borra todo, queda "0"

    let parsedValue = parseInt(cleanedValue, 10);
    if (isNaN(parsedValue)) parsedValue = 0;

    const product = data.find((p) => p.id === id);
    const maxQuantity = product?.quantity || 0;

    if (parsedValue > maxQuantity) {
      parsedValue = maxQuantity;
    }

    setEditingValues((prev) => ({ ...prev, [id]: parsedValue.toString() }));

    const updatedProducts = productsDelivered.map((p) =>
      p.id === id ? { ...p, quantity: parsedValue } : p
    );
    onProductEdit(updatedProducts as Array<{ id: string; quantity: number }>);
  };

  const getInputValue = (id: string) => {
    if (editingValues[id] !== undefined) return editingValues[id];
    return productsDelivered.find((p) => p.id === id)?.quantity.toString() || "0";
  };

  // Función para ordenar los datos mejorada
  const sortedData = React.useMemo(() => {
    let sortableData = [...data];

    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const valueA = a[sortConfig.key] ?? "";
        const valueB = b[sortConfig.key] ?? "";

        const numA = Number(valueA);
        const numB = Number(valueB);

        // Si ambos valores son números, ordenar como números
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }

        // Si no son números, ordenar como strings
        return sortConfig.direction === "asc"
          ? valueA.toString().localeCompare(valueB.toString())
          : valueB.toString().localeCompare(valueA.toString());
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredData = sortedData.filter((product) => {
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
              <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                Código {sortConfig?.key === "id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
                Producto {sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => requestSort("category")} style={{ cursor: "pointer" }}>
                Categoría {sortConfig?.key === "category" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => requestSort("quantity")} style={{ cursor: "pointer" }}>
                Cantidad Solicitada {sortConfig?.key === "quantity" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Cantidad Entregada</th>
              <th onClick={() => requestSort("unit_measurement")} style={{ cursor: "pointer" }}>
                Unidad de Medida {sortConfig?.key === "unit_measurement" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((product) => {
                return (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.quantity}</td>
                    <td>
                      <Input
                        type="number"
                        value={getInputValue(product.id)}
                        onChange={(e) => handleInputChange(product.id, e.target.value)}
                        min={0}
                        max={product.quantity}
                      />
                    </td>
                    <td>{product.unit_measurement}</td>
                    <td>{product.observations}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center">
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
