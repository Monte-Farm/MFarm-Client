import React, { useState } from "react";
import { Input, Table } from "reactstrap";

type RowData = Record<string, any>; // Tipo flexible para los datos

type Column<T> = {
  header: string;
  accessor: keyof T;
  editable?: boolean; // Añadido para saber qué campos se pueden editar
};

type SelectableTableProps<T> = {
  columns: Column<T>[]; // Columnas dinámicas
  data: T[]; // Datos dinámicos
  onSelectionChange?: (selectedRows: T[]) => void; // Callback para los datos seleccionados
};

const SelectableTable = <T extends RowData>({
  columns,
  data,
  onSelectionChange,
}: SelectableTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editedData, setEditedData] = useState<T[]>([...data]);

  // Manejar selección de checkbox
  const handleCheckboxChange = (rowIndex: number) => {
    const updatedSelection = new Set(selectedRows);
    if (updatedSelection.has(rowIndex)) {
      updatedSelection.delete(rowIndex);
    } else {
      updatedSelection.add(rowIndex);
    }
    setSelectedRows(updatedSelection);

    if (onSelectionChange) {
      const selectedData = Array.from(updatedSelection).map((index) => editedData[index]);
      onSelectionChange(selectedData);
    }
  };

  // Manejar cambios en inputs
  const handleInputChange = (rowIndex: number, field: keyof T, value: string) => {
    const updatedData = [...editedData];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [field]: value };
    setEditedData(updatedData);

    if (selectedRows.has(rowIndex) && onSelectionChange) {
      const selectedData = Array.from(selectedRows).map((index) => updatedData[index]);
      onSelectionChange(selectedData);
    }
  };

  return (
    <div className="table-responsive mt-3">
      <Table className="table-hover align-middle table-nowrap mb-0">
        <thead className="table-light">
          <tr>
            <th>
              <Input
                type="checkbox"
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  const updatedSelection = new Set<number>();
                  if (isChecked) {
                    data.forEach((_, index) => updatedSelection.add(index));
                  }
                  setSelectedRows(updatedSelection);

                  if (onSelectionChange) {
                    const selectedData = Array.from(updatedSelection).map((index) => editedData[index]);
                    onSelectionChange(selectedData);
                  }
                }}
              />
            </th>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                <Input
                  type="checkbox"
                  checked={selectedRows.has(rowIndex)}
                  onChange={() => handleCheckboxChange(rowIndex)}
                />
              </td>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.editable && selectedRows.has(rowIndex) ? (
                    <Input
                      type="text"
                      value={editedData[rowIndex][col.accessor]}
                      onChange={(e) =>
                        handleInputChange(rowIndex, col.accessor, e.target.value)
                      }
                    />
                  ) : (
                    row[col.accessor]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default SelectableTable;
