import React, { useEffect, useState, useCallback } from "react";
import { Input, Table } from "reactstrap";
import Pagination from "./Pagination";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  observations: string;
}

interface CreateOrderTableProps {
  data: any[];
  onProductSelect: (selectedProducts: OrderItem[]) => void;
  showStock?: boolean;
  showPagination?: boolean;
}

const CreateOrderTable: React.FC<CreateOrderTableProps> = ({
  data,
  onProductSelect,
  showStock = false,
  showPagination = true,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const rowsPerPage = 5;

  // Función para manejar el cambio en los inputs
  const handleInputChange = useCallback(
    (id: string, field: "quantity" | "price" | "observations", value: number | string) => {
      const product = data.find((p) => p.id === id);
      const maxQuantity = product?.quantity ?? Infinity;

      const updatedProducts = selectedProducts.map((p) =>
        p.id === id
          ? {
            ...p,
            [field]:
              field === "quantity" && showStock
                ? Math.min(isNaN(value as number) ? 0 : (value as number), maxQuantity)
                : value,
          }
          : p
      );
      setSelectedProducts(updatedProducts);
      onProductSelect(updatedProducts);
    },
    [selectedProducts, onProductSelect, data, showStock]
  );

  // Función para manejar el cambio en los checkboxes
  const handleCheckboxChange = useCallback((id: string, checked: boolean) => {
    if (checked) {
      const product = data.find((p) => p.id === id);
      setSelectedProducts((prev) => [
        ...prev,
        { id, quantity: 0, price: showStock ? parseFloat(product.averagePrice.toFixed(2)) : 0, observations: "" },
      ]);
    } else {
      setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
    }
  }, [data, showStock]);

  // Función para manejar el clic en una fila
  const handleRowClick = useCallback((id: string) => {
    const isSelected = selectedProducts.some((product) => product.id === id);
    handleCheckboxChange(id, !isSelected);
  }, [selectedProducts, handleCheckboxChange]);

  // Función para ordenar los datos
  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  // Función para manejar el clic en los encabezados de la tabla
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filtrar los datos basados en el texto de búsqueda
  const filteredData = sortedData.filter((product) => {
    const filter = filterText.toLowerCase();
    return (
      product.id.toLowerCase().includes(filter) ||
      product.name.toLowerCase().includes(filter) ||
      product.category.toLowerCase().includes(filter) ||
      product.unit_measurement.toLowerCase().includes(filter)
    );
  });

  // Datos paginados
  const paginatedData = showPagination
    ? filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : filteredData;

  // Reiniciar la página actual cuando cambia el filtro
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

      {showPagination ? (
        <Table className="table-hover align-middle table-nowrap mb-0" striped>
          <TableHeader showStock={showStock} requestSort={requestSort} sortConfig={sortConfig} />
          <TableBody
            data={paginatedData}
            selectedProducts={selectedProducts}
            handleRowClick={handleRowClick}
            handleCheckboxChange={handleCheckboxChange}
            handleInputChange={handleInputChange}
            showStock={showStock}
          />
        </Table>
      ) : (
        <SimpleBar style={{ height: "44vh" }}>
          <Table className="table-hover align-middle table-nowrap mb-0" striped>
            <TableHeader showStock={showStock} requestSort={requestSort} sortConfig={sortConfig} />
            <TableBody
              data={paginatedData}
              selectedProducts={selectedProducts}
              handleRowClick={handleRowClick}
              handleCheckboxChange={handleCheckboxChange}
              handleInputChange={handleInputChange}
              showStock={showStock}
            />
          </Table>
        </SimpleBar>
      )}

      {showPagination && (
        <div className="mt-3">
          <Pagination
            data={filteredData}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            perPageData={rowsPerPage}
          />
        </div>
      )}
    </div>
  );
};

// Componente TableHeader con soporte para ordenamiento
const TableHeader: React.FC<{
  showStock: boolean;
  requestSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
}> = ({ showStock, requestSort, sortConfig }) => {
  const getSortIndicator = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === "asc" ? " ▲" : " ▼";
    }
    return null;
  };

  return (
    <thead className="table-light sticky-top">
      <tr>
        <th>Seleccionar</th>
        <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
          Código {getSortIndicator("id")}
        </th>
        <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
          Producto {getSortIndicator("name")}
        </th>
        <th onClick={() => requestSort("category")} style={{ cursor: "pointer" }}>
          Categoría {getSortIndicator("category")}
        </th>
        {showStock && <th onClick={() => requestSort("quantity")} style={{ cursor: "pointer" }}>
          Existencias {getSortIndicator("quantity")}
        </th>}
        <th>Cantidad</th>
        <th onClick={() => requestSort("unit_measurement")} style={{ cursor: "pointer" }}>
          Unidad de medida {getSortIndicator("unit_measurement")}
        </th>
        {showStock ? (
          <th onClick={() => requestSort("averagePrice")} style={{ cursor: "pointer" }}>
            Precio Promedio {getSortIndicator("averagePrice")}
          </th>
        ) : (
          <th>Precio Unitario</th>
        )}
        <th>Observaciones</th>
      </tr>
    </thead>
  );
};

// Componente TableBody sin cambios
const TableBody: React.FC<{
  data: any[];
  selectedProducts: OrderItem[];
  handleRowClick: (id: string) => void;
  handleCheckboxChange: (id: string, checked: boolean) => void;
  handleInputChange: (id: string, field: "quantity" | "price" | "observations", value: number | string) => void;
  showStock: boolean;
}> = ({ data, selectedProducts, handleRowClick, handleCheckboxChange, handleInputChange, showStock }) => (
  <tbody>
    {data.length > 0 ? (
      data.map((product) => {
        const selectedProduct = selectedProducts.find((p) => p.id === product.id);
        const isSelected = !!selectedProduct;

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
            {showStock && <td>{product.quantity}</td>}
            <td>
              <Input
                type="number"
                value={selectedProduct?.quantity || ""}
                onChange={(e) => handleInputChange(product.id, "quantity", parseInt(e.target.value, 10))}
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
                  value={selectedProduct?.price || ""}
                  onChange={(e) => handleInputChange(product.id, "price", parseFloat(e.target.value))}
                  disabled={!isSelected}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
            )}
            <td>
              <Input
                type="text"
                value={selectedProduct?.observations || ""}
                onChange={(e) => handleInputChange(product.id, "observations", e.target.value)}
                disabled={!isSelected}
                onClick={(e) => e.stopPropagation()}
                placeholder="Escribe observaciones..."
              />
            </td>
          </tr>
        );
      })
    ) : (
      <tr>
        <td colSpan={showStock ? 9 : 8} className="text-center">
          No hay productos disponibles.
        </td>
      </tr>
    )}
  </tbody>
);

export default CreateOrderTable;