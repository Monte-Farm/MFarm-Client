import React, { useState, useEffect } from "react";
import { Table, Input } from "reactstrap";
import Pagination from "./Pagination";

type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: any, row: T) => React.ReactNode;
  isFilterable?: boolean; // Nuevo campo para indicar si la columna es filtrable
};

type CustomTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  className?: string;
  showSearchAndFilter?: boolean;
  rowClickable?: boolean;
  onRowClick?: (row: T) => void;
  rowsPerPage?: number;
};

const CustomTable = <T,>({
  columns,
  data,
  className = "",
  showSearchAndFilter = true,
  rowClickable = false,
  onRowClick,
  rowsPerPage = 10,
}: CustomTableProps<T>) => {
  const [filterText, setFilterText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filteredData, setFilteredData] = useState<T[]>(data);

  // Filtrar datos según texto de búsqueda
  useEffect(() => {
    const result = data.filter((row) => {
      if (!filterText) return true;

      // Buscar en columnas marcadas como filtrables
      return columns.some((col) => {
        if (col.isFilterable) {
          const cellValue = row[col.accessor];
          return cellValue?.toString().toLowerCase().includes(filterText.toLowerCase());
        }
        return false;
      });
    });

    setFilteredData(result);
    setCurrentPage(1); // Reinicia a la primera página al filtrar
  }, [filterText, columns, data]);

  // Datos paginados según la página actual
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
      <div className="table-responsive mt-3">
        <Table className={`table-hover align-middle table-nowrap mb-0 ${className}`}>
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
                      {col.render
                        ? col.render(row[col.accessor], row)
                        : row[col.accessor]?.toString()}
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

      {/* Paginación */}
      <div className="mt-4">
        <Pagination
          data={filteredData}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          perPageData={rowsPerPage}
        />
      </div>
    </>
  );
};

export default CustomTable;
