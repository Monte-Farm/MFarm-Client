import React, { useState, useEffect } from "react";
import { Table } from "reactstrap";
import Pagination from "./Pagination";
import TableFilter from "./TableFilter";

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
  defaultFilterField?: keyof T;
};

const CustomTable = <T,>({
  columns,
  data,
  className = "",
  showSearchAndFilter = true,
  rowClickable = false,
  onRowClick,
  rowsPerPage = 10,
  defaultFilterField,
}: CustomTableProps<T>) => {
  const [filterText, setFilterText] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<keyof T | "">("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filteredData, setFilteredData] = useState<T[]>(data);

  // Filtrar datos según texto y filtro seleccionado
  useEffect(() => {
    const result = data.filter((row) => {
      if (!filterText || !selectedFilter) return true;
      const cellValue = row[selectedFilter];
      return cellValue?.toString().toLowerCase().includes(filterText.toLowerCase());
    });
    setFilteredData(result);
    setCurrentPage(1); // Reinicia a la primera página al filtrar
  }, [filterText, selectedFilter, data]);

  // Datos paginados según la página actual
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <>
      {showSearchAndFilter && (
        <TableFilter
          columns={columns}
          filterText={filterText}
          selectedFilter={selectedFilter}
          onFilterTextChange={setFilterText}
          onFilterChange={setSelectedFilter}
          defaultFilterField={defaultFilterField}/>
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
