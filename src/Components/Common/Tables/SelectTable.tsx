import { categoryLabels } from "common/product_categories";
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Input, Pagination, Table } from "reactstrap";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { deriveCurrencySymbol } from "utils/intlHelpers";

type SelectedProduct = { id: string; quantity: number; price: number; totalPrice: number };

interface SelectTableProps {
  data: any[];
  onProductSelect: (selectedProducts: SelectedProduct[]) => void;
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
  const globalConfig = useSelector((state: any) => state.Configurations?.globalConfig);
  const currency: string = globalConfig?.currency || 'USD';
  const locale: string = globalConfig?.locale || 'es-MX';
  const currencySymbol = deriveCurrencySymbol(currency, locale);

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value || 0),
    [locale, currency]
  );

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    () => (initialSelected ?? []).map(p => ({
      ...p,
      totalPrice: (p.quantity || 0) * (p.price || 0),
    }))
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const rowsPerPage = 5;

  const handleInputChange = useCallback(
    (id: string, field: "quantity" | "price" | "totalPrice", value: number) => {
      const product = data.find((p) => p.id === id);
      const maxQuantity = product?.quantity ?? Infinity;
      const safeValue = isNaN(value) ? 0 : value;

      const updatedProducts = selectedProducts.map((p) => {
        if (p.id !== id) return p;

        if (field === "quantity") {
          const qty = showStock ? Math.min(safeValue, maxQuantity) : safeValue;
          return { ...p, quantity: qty, totalPrice: qty * p.price };
        }
        if (field === "price") {
          return { ...p, price: safeValue, totalPrice: p.quantity * safeValue };
        }
        if (field === "totalPrice") {
          const derivedPrice = p.quantity > 0 ? safeValue / p.quantity : 0;
          return { ...p, totalPrice: safeValue, price: derivedPrice };
        }
        return p;
      });

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
        { id, quantity: 0, price: showStock ? parseFloat(product.averagePrice) : 0, totalPrice: 0 },
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
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) =>
      prev && prev.key === key && prev.direction === "asc"
        ? { key, direction: "desc" }
        : { key, direction: "asc" }
    );
  };

  const filteredData = React.useMemo(() => {
    if (!filterText) return sortedData;
    const filter = filterText.toLowerCase();
    return sortedData.filter((product) =>
      String(product.code || product.id || '').toLowerCase().includes(filter) ||
      String(product.name || '').toLowerCase().includes(filter) ||
      String(product.category || '').toLowerCase().includes(filter) ||
      String(product.unit_measurement || '').toLowerCase().includes(filter)
    );
  }, [sortedData, filterText]);

  const paginatedData = showPagination
    ? filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : filteredData;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  const tableProps = {
    showStock,
    requestSort,
    sortConfig,
    t,
    selectedProducts,
    handleRowClick,
    handleCheckboxChange,
    handleInputChange,
    formatCurrency,
    currencySymbol,
  };

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
          <TableHeader {...tableProps} />
          <TableBody data={paginatedData} {...tableProps} />
        </Table>
      ) : (
        <SimpleBar style={{ height: "44vh" }}>
          <Table className="table-hover align-middle table-nowrap mb-0" striped>
            <TableHeader {...tableProps} />
            <TableBody data={paginatedData} {...tableProps} />
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

type SharedTableProps = {
  showStock: boolean;
  requestSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  t: (key: string, opts?: Record<string, any>) => string;
  selectedProducts: SelectedProduct[];
  handleRowClick: (id: string) => void;
  handleCheckboxChange: (id: string, checked: boolean) => void;
  handleInputChange: (id: string, field: "quantity" | "price" | "totalPrice", value: number) => void;
  formatCurrency: (value: number) => string;
  currencySymbol: string;
};

const TableHeader: React.FC<SharedTableProps> = ({ showStock, requestSort, sortConfig, t, currencySymbol }) => {
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
          <th>{t("shared.selectTable.col.unitPrice")} ({currencySymbol})</th>
        )}
        <th>{t("shared.selectTable.col.totalPrice", { defaultValue: "Precio Total" })} ({currencySymbol})</th>
      </tr>
    </thead>
  );
};

const TableBody: React.FC<SharedTableProps & { data: any[] }> = ({
  data, selectedProducts, handleRowClick, handleCheckboxChange, handleInputChange,
  showStock, formatCurrency, currencySymbol, t,
}) => (
  <tbody>
    {data.length > 0 ? (
      data.map((product) => {
        const isSelected = selectedProducts.some((p) => p.id === product.id);
        const sel = selectedProducts.find((p) => p.id === product.id);
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
                  value={sel?.quantity || ""}
                  onChange={(e) => handleInputChange(product.id, "quantity", parseInt(e.target.value, 10))}
                  disabled={!isSelected}
                  onClick={(e) => e.stopPropagation()}
                  aria-describedby="unit-addon"
                />
                <span className="input-group-text" id="unit-addon">{product.unit_measurement}</span>
              </div>
            </td>
            {showStock ? (
              <>
                <td>{formatCurrency(parseFloat(product.averagePrice) || 0)}</td>
                <td>{isSelected && sel ? formatCurrency((sel.quantity || 0) * parseFloat(product.averagePrice || 0)) : '—'}</td>
              </>
            ) : (
              <>
                <td>
                  <div className="input-group">
                    <span className="input-group-text">{currencySymbol}</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={sel?.price || ""}
                      onChange={(e) => handleInputChange(product.id, "price", parseFloat(e.target.value))}
                      disabled={!isSelected}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </td>
                <td>
                  <div className="input-group">
                    <span className="input-group-text">{currencySymbol}</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={sel?.totalPrice || ""}
                      onChange={(e) => handleInputChange(product.id, "totalPrice", parseFloat(e.target.value))}
                      disabled={!isSelected}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </td>
              </>
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
