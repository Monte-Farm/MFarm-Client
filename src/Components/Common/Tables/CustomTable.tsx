import React, { useState, useEffect, useMemo } from "react";
import { Table, Input } from "reactstrap";
import Pagination from "./Pagination";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Column, ColumnType } from "common/data/data_types";

type CustomTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  className?: string;
  showSearchAndFilter?: boolean;
  rowClickable?: boolean;
  onRowClick?: (row: T) => void;
  rowsPerPage?: number;
  showPagination?: boolean;
};

const formatValue = (value: any, type?: ColumnType) => {
  if (value == null) return "";
  switch (type) {
    case "number":
      return new Intl.NumberFormat().format(value);
    case "date":
      return new Date(value).toLocaleDateString();
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    default:
      return value.toString();
  }
};

const CustomTable = <T,>({
  columns,
  data,
  className = "",
  showSearchAndFilter = true,
  rowClickable = false,
  onRowClick,
  rowsPerPage = 10,          // ✅ por defecto como la otra tabla
  showPagination = true,
}: CustomTableProps<T>) => {

  const [filterText, setFilterText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

  // ✅ Filtro
  const filteredData = useMemo(() => {
    if (!filterText) return data;

    return data.filter((row) =>
      columns.some((col) => {
        if (!col.isFilterable) return false;
        const cell = row[col.accessor];
        return cell?.toString().toLowerCase().includes(filterText.toLowerCase());
      })
    );
  }, [filterText, data, columns]);

  // ✅ Reiniciar página cuando cambie el filtro o la data
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, data.length]);

  // ✅ Ordenamiento
  const sortedData = useMemo(() => {
    let sortable = [...filteredData];
    if (sortConfig) {
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredData, sortConfig]);

  const requestSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key && prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  const start = (currentPage - 1) * rowsPerPage;
  const paginatedData = showPagination
    ? sortedData.slice(start, start + rowsPerPage)
    : sortedData;

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  return (
    <>
      {showSearchAndFilter && (
        <div className="d-flex justify-content-between mb-3">
          <Input
            type="text"
            placeholder="Buscar..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      )}

      {/* ✅ TABLA */}
      <SimpleBar style={{ maxHeight: showPagination ? "none" : "60vh" }}>
        <Table className={`table-hover align-middle table-nowrap mb-0 ${className} fs-5`}>
          <thead className="table-light sticky-top">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  onClick={() => requestSort(col.accessor)}
                  style={{ cursor: "pointer" }}
                >
                  {col.header}
                  {sortConfig?.key === col.accessor &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, i) => (
                <tr
                  key={i}
                  className={rowClickable ? "table-row-clickable" : ""}
                  onClick={() => rowClickable && onRowClick?.(row)}
                  style={{ cursor: rowClickable ? "pointer" : "default" }}
                >
                  {columns.map((col, j) => (
                    <td key={j}>
                      {col.render
                        ? col.render(row[col.accessor], row)
                        : formatValue(row[col.accessor], col.type)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  No se encontraron datos
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </SimpleBar>

      {showPagination && totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            data={filteredData}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            perPageData={rowsPerPage}
          />
        </div>
      )}
    </>
  );
};

export default CustomTable;