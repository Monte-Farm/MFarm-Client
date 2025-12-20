import React, { useState, useEffect } from "react";
import { Badge, Input, Table } from "reactstrap";
import SimpleBar from "simplebar-react";

interface OrderProductsTableProps {
  data: any[];
  onProductEdit: (updatedProducts: Array<{ id: string; quantity: number; price: number; observations: string }>) => void;
}

const OrderTable: React.FC<OrderProductsTableProps> = ({ data, onProductEdit }) => {
  const [filterText, setFilterText] = useState<string>("");
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // 🔥 Enviar valores iniciales con quantity=0 si nadie edita
  useEffect(() => {
    const initialProducts = data.map(p => ({
      id: p.id,
      quantity: 0,
      price: p.price ?? 0,
      observations: p.observations ?? ""
    }));

    onProductEdit(initialProducts);
  }, [data]);

  const handleInputChange = (id: string, value: string) => {
    let cleanedValue = value.replace(/^0+/, "") || "0";
    let parsedValue = parseInt(cleanedValue, 10);

    if (isNaN(parsedValue)) parsedValue = 0;

    const product = data.find((p) => p.id === id);
    const maxQuantity = product?.quantity || 0;

    if (parsedValue > maxQuantity) parsedValue = maxQuantity;

    setEditingValues((prev) => ({ ...prev, [id]: parsedValue.toString() }));

    // 🔁 Siempre enviamos todos los productos
    const updatedProducts = data.map((p) => ({
      id: p.id,
      quantity: parseInt(editingValues[p.id] ?? (p.id === id ? parsedValue.toString() : "0"), 10),
      price: p.price ?? 0,
      observations: p.observations ?? ""
    }));

    onProductEdit(updatedProducts);
  };

  const getInputValue = (id: string) => editingValues[id] ?? "0";

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];

    if (sortConfig) {
      sortableData.sort((a, b) => {
        const valueA = a[sortConfig.key] ?? "";
        const valueB = b[sortConfig.key] ?? "";

        const numA = Number(valueA);
        const numB = Number(valueB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }

        return sortConfig.direction === "asc"
          ? valueA.toString().localeCompare(valueB.toString())
          : valueB.toString().localeCompare(valueA.toString());
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
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

  const renderCategoryBadge = (value: string) => {
    const map: Record<string, { color: string; label: string }> = {
      nutrition: { color: "info", label: "Nutrición" },
      medications: { color: "warning", label: "Medicamentos" },
      vaccines: { color: "primary", label: "Vacunas" },
      vitamins: { color: "success", label: "Vitaminas" },
      minerals: { color: "success", label: "Minerales" },
      supplies: { color: "secondary", label: "Insumos" },
      hygiene_cleaning: { color: "dark", label: "Higiene y desinfección" },
      equipment_tools: { color: "info", label: "Equipamiento y herramientas" },
      spare_parts: { color: "danger", label: "Refacciones y repuestos" },
      office_supplies: { color: "secondary", label: "Material de oficina" },
      others: { color: "secondary", label: "Otros" },
    };

    const category = map[value] || { color: "secondary", label: value };
    return <Badge color={category.color}>{category.label}</Badge>;
  };

  return (
    <div className="table-responsive">
      <SimpleBar style={{ maxHeight: "500px" }}>
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
                Solicitado {sortConfig?.key === "quantity" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Entregado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{renderCategoryBadge(product.category)}</td>
                  <td>{product.quantity} {product.unit_measurement}</td>
                  <td>
                    <div className="input-group">
                      <Input
                        type="number"
                        value={getInputValue(product.id)}
                        onChange={(e) => handleInputChange(product.id, e.target.value)}
                        min={0}
                        max={product.quantity}
                      />
                      <span className="input-group-text">{product.unit_measurement}</span>
                    </div>
                  </td>
                  <td>{product.observations || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center">No hay productos disponibles.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </SimpleBar>
    </div>
  );
};

export default OrderTable;