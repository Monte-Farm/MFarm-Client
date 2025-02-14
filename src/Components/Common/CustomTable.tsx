import React, { useState, useEffect } from "react";
import { Table, Input } from "reactstrap";
import Pagination from "./Pagination";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: any, row: T) => React.ReactNode;
  isFilterable?: boolean;
};

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

const CustomTable = <T,>({
  columns,
  data,
  className = "",
  showSearchAndFilter = true,
  rowClickable = false,
  onRowClick,
  rowsPerPage = 10,
  showPagination = true,
}: CustomTableProps<T>) => {
  const [filterText, setFilterText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filteredData, setFilteredData] = useState<T[]>(data);

  useEffect(() => {
    const result = data.filter((row) => {
      if (!filterText) return true;

      return columns.some((col) => {
        if (col.isFilterable) {
          const cellValue = row[col.accessor];
          return cellValue?.toString().toLowerCase().includes(filterText.toLowerCase());
        }
        return false;
      });
    });

    setFilteredData(result);
    setCurrentPage(1);
  }, [filterText, columns, data]);

  // Datos paginados o sin paginar según `showPagination`
  const paginatedData = showPagination
    ? filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : filteredData;

  return (
    <>
      {showSearchAndFilter && (
        <div className="d-flex justify-content-between mb-3">
          <Input
            type="text"
            placeholder="Buscar..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            aria-label="Buscar en la tabla"
          />
        </div>
      )}

      {/* Tabla */}
      {showPagination ? (
        <div className="table-responsive mt-3">
          <Table className={`table-hover align-middle table-nowrap mb-0 ${className} fs-5`}>
            <thead className="table-light">
              <tr>
                {columns.map((col, index) => (
                  <th key={index} scope="col">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowClickable ? "table-row-clickable" : ""}
                    onClick={() => rowClickable && onRowClick && onRowClick(row)}
                    style={{ cursor: rowClickable ? "pointer" : "default" }}
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex}>
                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]?.toString()}
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
        </div>
      ) : (
        <SimpleBar style={{height: '100%', overflowY: 'auto'}}>
          <Table className={`table-hover align-middle table-nowrap mb-0 ${className} fs-5`}>
            <thead className="table-light sticky-top">
              <tr>
                {columns.map((col, index) => (
                  <th key={index} scope="col">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowClickable ? "table-row-clickable" : ""}
                    onClick={() => rowClickable && onRowClick && onRowClick(row)}
                    style={{ cursor: rowClickable ? "pointer" : "default" }}
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex}>
                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]?.toString()}
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
      )}

      {/* Paginación */}
      {showPagination && (
        <div className="mt-4">
          <Pagination data={filteredData} currentPage={currentPage} setCurrentPage={setCurrentPage} perPageData={rowsPerPage} />
        </div>
      )}
    </>
  );
};

export default CustomTable;
