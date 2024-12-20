import React, { useState } from "react";
import { Input, Table } from "reactstrap";

type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: any, row: T) => React.ReactNode;
};

type CustomTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  className?: string;
  showSearchAndFilter?: boolean; // Propiedad para mostrar búsqueda y filtro
  rowClickable?: boolean; // Nueva propiedad para habilitar o deshabilitar los clics en filas
  onRowClick?: (row: T) => void; // Método que se ejecuta al hacer clic en una fila
};

const CustomTable = <T,>({
  columns,
  data,
  className = "",
  showSearchAndFilter = true,
  rowClickable = false,
  onRowClick,
}: CustomTableProps<T>) => {
  const [filterText, setFilterText] = useState<string>(""); // Texto de búsqueda
  const [selectedFilter, setSelectedFilter] = useState<keyof T | "">(""); // Filtro seleccionado

  // Filtrar datos según el texto y el filtro seleccionado
  const filteredData = data.filter((row) => {
    if (!filterText || !selectedFilter) return true; // Mostrar todo si no hay filtro aplicado
    const cellValue = row[selectedFilter];
    return cellValue?.toString().toLowerCase().includes(filterText.toLowerCase());
  });

  return (
    <>
      {showSearchAndFilter && (
        <div className="d-flex align-items-center gap-2 mt-4 ms-4">
          {/* Cuadro de búsqueda */}
          <div className="form-icon w-75">
            <Input
              type="text"
              className="form-control form-control-icon"
              placeholder="Buscar..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <i className="ri-search-line"></i>
          </div>

          {/* Filtro */}
          <Input
            type="select"
            className="form-control w-25 me-4"
            value={selectedFilter as string}
            onChange={(e) => setSelectedFilter(e.target.value as keyof T | "")}
          >
            <option value="">Seleccionar Filtro</option>
            {columns.map((col, index) => (
              <option key={index} value={col.accessor as string}>
                {col.header}
              </option>
            ))}
          </Input>
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
            {filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
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
    </>
  );
};

export default CustomTable;
