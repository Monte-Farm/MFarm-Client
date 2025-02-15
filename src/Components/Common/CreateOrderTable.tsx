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
  showPagination = true 
}) => {
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]); 
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>("");
  const rowsPerPage = 5;

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

  const handleCheckboxChange = useCallback((id: string, checked: boolean) => {
    if (checked) {
      const product = data.find((p) => p.id === id);
      setSelectedProducts((prev) => [
        ...prev, 
        { id, quantity: 0, price: showStock ? parseFloat(product.averagePrice.toFixed(2)) : 0, observations: "" }
      ]);
    } else {
      setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
    }
  }, [data, showStock]);

  const handleRowClick = useCallback((id: string) => {
    const isSelected = selectedProducts.some((product) => product.id === id);
    handleCheckboxChange(id, !isSelected);
  }, [selectedProducts, handleCheckboxChange]);

  const filteredData = data.filter((product) => {
    const filter = filterText.toLowerCase();
    return (
      product.id.toLowerCase().includes(filter) ||
      product.name.toLowerCase().includes(filter) ||
      product.category.toLowerCase().includes(filter) ||
      product.unit_measurement.toLowerCase().includes(filter)
    );
  });

  const paginatedData = showPagination
    ? filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : filteredData;

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
          <TableHeader showStock={showStock} />
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
            <TableHeader showStock={showStock} />
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

const TableHeader: React.FC<{ showStock: boolean }> = ({ showStock }) => (
  <thead className="table-light sticky-top">
    <tr>
      <th>Seleccionar</th>
      <th>Código</th>
      <th>Producto</th>
      <th>Categoría</th>
      {showStock && <th>Existencias</th>}
      <th>Cantidad</th>
      <th>Unidad de medida</th>
      {showStock ? <th>Precio Promedio</th> : <th>Precio Unitario</th>}
      <th>Observaciones</th>
    </tr>
  </thead>
);

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
