import React from "react";
import { Input, Table } from "reactstrap";
import { ProductData } from "./ProductForm";

interface SelectTableProps {
  data: ProductData[];
  onProductSelect: (selectedProducts: Array<{ id: string; quantity: number; unitPrice: number }>) => void;
}

const SelectTable: React.FC<SelectTableProps> = ({ data, onProductSelect }) => {
  const [selectedProducts, setSelectedProducts] = React.useState<Array<{ id: string; quantity: number; unitPrice: number }>>([]);

  // Manejar cambios de cantidad y precio
  const handleInputChange = (id: string, field: string, value: any) => {
    // Permitir que el campo quede vacío
    if (value === "") {
      value = 0; // O puedes decidir no actualizar el valor si está vacío
    }

    const updatedProducts = selectedProducts.map((product) =>
      product.id === id ? { ...product, [field]: value } : product
    );
    setSelectedProducts(updatedProducts);
    onProductSelect(updatedProducts);
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      const newProduct = { id, quantity: 0, unitPrice: 0 };
      setSelectedProducts((prev) => [...prev, newProduct]);
    } else {
      setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
    }
  };

  const handleRowClick = (id: string) => {
    const productChecked = selectedProducts.some((product) => product.id === id);
    handleCheckboxChange(id, !productChecked);
  };

  return (
    <div className="table-responsive">
      <Table className="table-hover align-middle table-nowrap mb-0" striped>
        <thead className="table-light">
          <tr>
            <th>Seleccionar</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unitario</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product) => (
            <tr
              key={product.id}
              onClick={() => handleRowClick(product.id)}
              style={{ cursor: "pointer" }}
            >
              <td>
                <Input
                  type="checkbox"
                  checked={selectedProducts.some((p) => p.id === product.id)}
                  onChange={(e) => handleCheckboxChange(product.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()} />
              </td>
              <td>{product.productName}</td>
              <td>
                <Input
                  type="number"
                  value={selectedProducts.find((p) => p.id === product.id)?.quantity || ""}
                  onChange={(e) =>
                    handleInputChange(product.id, "quantity", e.target.value === "" ? "" : parseInt(e.target.value, 10))
                  }
                  disabled={!selectedProducts.some((p) => p.id === product.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td>
                <Input
                  type="number"
                  value={selectedProducts.find((p) => p.id === product.id)?.unitPrice || ""}
                  onChange={(e) =>
                    handleInputChange(product.id, "unitPrice", e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                  disabled={!selectedProducts.some((p) => p.id === product.id)}
                  onClick={(e) => e.stopPropagation()} 
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default SelectTable;
