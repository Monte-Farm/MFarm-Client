import { categoryLabels } from "common/product_categories";
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Input, Pagination, Table } from "reactstrap";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface SelectTableProps {
  data: any[];
  onProductSelect: (
    selectedProducts: Array<{ id: string; quantity: number; price: number }>
  ) => void;
  showStock?: boolean;
  showPagination?: boolean;
  initialSelected?: Array<{ id: string; quantity: number; price: number }>;
}

const SelectTable: React.FC<SelectTableProps> = ({
  data,
  onProductSelect,
  showStock = false,
  showPagination = true,
  initialSelected,
}) => {
  const { t } = useTranslation();
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ id: string; quantity: number; price: number }>
  >(initialSelected ?? []);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const rowsPerPage = 5;

  const handleInputChange = useCallback(
    (id: string, field: "quantity" | "price", value: number) => {
      const product = data.find((p) => p.id === id);
      const maxQuantity = product?.quantity ?? Infinity;

      const updatedProducts = selectedProducts.map((p) =>
        p.id === id
          ? {
            ...p,
            [field]:
              field === "quantity" && showStock
                ? Math.min(isNaN(value) ? 0 : value, maxQuantity)
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
      const product = data.find((p) => p.id === id);
      setSelectedProducts((prev) => [
        ...prev,
        { id, quantity: 0, price: showStock ? parseFloat(product.averagePrice) : 0 }
      ]);
    } else {
      setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
    }
  }, [data, showStock]);

  const handleRowClick = useCallback((id: string) => {
    const isSelected = selectedProducts.some((product) => product.id === id);
    handleCheckboxChange(id, !isSelected);
  }, [selectedProducts, handleCheckboxChange]);

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
          placeholder={t("shared.table.searchProduct")}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          aria-label={t("shared.table.searchProduct")}
        />
      </div>

      {showPagination ? (
        <Table className="table-hover align-middle table-nowrap mb-0" striped>
          <TableHeader showStock={showStock} requestSort={requestSort} sortConfig={sortConfig} t={t} />
          <TableBody
            data={paginatedData}
            selectedProducts={selectedProducts}
            handleRowClick={handleRowClick}
            handleCheckboxChange={handleCheckboxChange}
            handleInputChange={handleInputChange}
            showStock={showStock}
            t={t}
          />
        </Table>
      ) : (
        <SimpleBar style={{ height: "44vh" }}>
          <Table className="table-hover align-middle table-nowrap mb-0" striped>
            <TableHeader showStock={showStock} requestSort={requestSort} sortConfig={sortConfig} t={t} />
            <TableBody
              data={paginatedData}
              selectedProducts={selectedProducts}
              handleRowClick={handleRowClick}
              handleCheckboxChange={handleCheckboxChange}
              handleInputChange={handleInputChange}
              showStock={showStock}
              t={t}
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

const TableHeader: React.FC<{
  showStock: boolean;
  requestSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  t: (key: string, opts?: Record<string, any>) => string;
}> = ({ showStock, requestSort, sortConfig, t }) => {
  const getSortIndicator = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === "asc" ? " ▲" : " ▼";
    }
    return null;
  };

  return (
    <thead className="table-light sticky-top">
      <tr>
        <th>{t("shared.selectTable.col.select")}</th>
        <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
          {t("shared.selectTable.col.code")} {getSortIndicator("id")}
        </th>
        <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
          {t("shared.selectTable.col.product")} {getSortIndicator("name")}
        </th>
        <th onClick={() => requestSort("category")} style={{ cursor: "pointer" }}>
          {t("shared.selectTable.col.category")} {getSortIndicator("category")}
        </th>
        {showStock && (
          <th onClick={() => requestSort("quantity")} style={{ cursor: "pointer" }}>
            {t("shared.selectTable.col.stock")} {getSortIndicator("quantity")}
          </th>
        )}
        <th>{t("shared.selectTable.col.quantity")}</th>
        {showStock ? (
          <th onClick={() => requestSort("averagePrice")} style={{ cursor: "pointer" }}>
            {t("shared.selectTable.col.avgPrice")} {getSortIndicator("averagePrice")}
          </th>
        ) : (
          <th>{t("shared.selectTable.col.unitPrice")}</th>
        )}
      </tr>
    </thead>
  );
};

const TableBody: React.FC<{
  data: any[];
  selectedProducts: any[];
  handleRowClick: (id: string) => void;
  handleCheckboxChange: (id: string, checked: boolean) => void;
  handleInputChange: (id: string, field: "quantity" | "price", value: number) => void;
  showStock: boolean;
  t: (key: string, opts?: Record<string, any>) => string;
}> = ({ data, selectedProducts, handleRowClick, handleCheckboxChange, handleInputChange, showStock, t }) => (
  <tbody>
    {data.length > 0 ? (
      data.map((product) => {
        const isSelected = selectedProducts.some((p) => p.id === product.id);
        return (
          <tr key={product.id} onClick={() => handleRowClick(product.id)} style={{ cursor: "pointer" }}>
            <td>
              <Input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleCheckboxChange(product.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`${t("shared.selectTable.col.select")} ${product.name}`}
              />
            </td>
            <td>{product.id}</td>
            <td>{product.name}</td>
            <td>{t(`warehouse.common.productCategory.${product.category}`, { defaultValue: categoryLabels[product.category] || product.category })}</td>
            {showStock && <td>{product.quantity}</td>}
            <td>
              <div className="input-group">
                <Input
                  type="number"
                  value={selectedProducts.find((p) => p.id === product.id)?.quantity || ""}
                  onChange={(e) => handleInputChange(product.id, "quantity", parseInt(e.target.value, 10))}
                  disabled={!isSelected}
                  onClick={(e) => e.stopPropagation()}
                  aria-describedby="unit-addon"
                />
                <span className="input-group-text" id="unit-addon">{product.unit_measurement}</span>
              </div>
            </td>
            {showStock ? (
              <td>${product.averagePrice}</td>
            ) : (
              <td>
                <Input
                  type="number"
                  value={selectedProducts.find((p) => p.id === product.id)?.price || ""}
                  onChange={(e) => handleInputChange(product.id, "price", parseFloat(e.target.value))}
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
        <td colSpan={showStock ? 8 : 7} className="text-center">
          {t("shared.selectTable.noProducts")}
        </td>
      </tr>
    )}
  </tbody>
);

export default SelectTable;
