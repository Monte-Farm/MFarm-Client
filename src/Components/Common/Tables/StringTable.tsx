import React, { useEffect, useState } from "react";
import { Button, Input, Pagination, Table } from "reactstrap";

interface StringTableProps {
  name: string; // Nombre del campo en Formik
  values: string[];
  onChange: (name: string, newValues: string[]) => void; // Actualiza los valores en Formik
}

const StringTable = ({ name, values, onChange }: StringTableProps) => {
  const [newValue, setNewValue] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const handleAdd = () => {
    if (newValue.trim()) {
      const updatedValues = [...values, newValue.trim()];
      onChange(name, updatedValues);
      setNewValue("");
    }
  };

  const handleDelete = (index: number) => {
    const updatedValues = values.filter((_, i) => i !== index);
    onChange(name, updatedValues);
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditingValue(values[index]);
  };

  const handleEditSave = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const updatedValues = [...values];
      updatedValues[editingIndex] = editingValue.trim();
      onChange(name, updatedValues);
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  // Paginación: Calculando los elementos a mostrar para la página actual
  const paginatedValues = values.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1)
  }, [])

  return (
    <>
      <div className="d-flex gap-3 mt-1 mb-1">
        <Input
          type="text"
          placeholder="Nuevo valor"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <Button color="primary" onClick={handleAdd}>Agregar</Button>
      </div>

      <Table hover>
        <thead>
          <tr>
            <th>Valor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginatedValues.map((value, index) => (
            <tr key={index}>
              <td className="w-75">
                {editingIndex === index ? (
                  <Input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                  />
                ) : (
                  value
                )}
              </td>
              <td>
                {editingIndex === index ? (
                  <>
                    <Button className="me-1" color="success" onClick={handleEditSave}><i className="ri-check-fill align-middle" /></Button>
                    <Button color="secondary" onClick={() => setEditingIndex(null)}><i className="ri-close-fill align-middle" /></Button>
                  </>
                ) : (
                  <>
                    <Button className="me-1" color="secondary" onClick={() => handleEditStart(index)}><i className="ri-pencil-fill align-middle" /></Button>
                    <Button color="danger" onClick={() => handleDelete(index)}><i className="ri-delete-bin-fill align-middle" /></Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination
        data={values}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPageData={itemsPerPage}
      />
    </>
  );
};

export default StringTable;
