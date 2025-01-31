import React, { useEffect, useState } from "react";
import { Button, Input, Table } from "reactstrap";
import Pagination from "./Pagination"; // Componente de paginación
import { Tax } from "common/data_interfaces";


interface TaxesTableProps {
  name: string; // Nombre del campo en Formik
  taxes: Tax[]; // Array de objetos con información de impuestos
  onChange: (name: string, newTaxes: Tax[]) => void; // Actualiza los valores en Formik
}

const TaxesTable = ({ name, taxes, onChange }: TaxesTableProps) => {
  const [newTax, setNewTax] = useState<Tax>({ taxName: "", percentage: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTax, setEditingTax] = useState<Tax>({ taxName: "", percentage: 0 });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const handleAdd = () => {
    if (newTax.taxName.trim() && newTax.percentage >= 0) {
      const updatedTaxes = [...taxes, newTax];
      onChange(name, updatedTaxes);
      setNewTax({ taxName: "", percentage: 0 });
    }
  };

  const handleDelete = (index: number) => {
    const updatedTaxes = taxes.filter((_, i) => i !== index);
    onChange(name, updatedTaxes);
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditingTax(taxes[index]);
  };

  const handleEditSave = () => {
    if (editingIndex !== null && editingTax.taxName.trim() && editingTax.percentage >= 0) {
      const updatedTaxes = [...taxes];
      updatedTaxes[editingIndex] = editingTax;
      onChange(name, updatedTaxes);
      setEditingIndex(null);
      setEditingTax({ taxName: "", percentage: 0 });
    }
  };

  // Paginación: Calculando los elementos a mostrar para la página actual
  const paginatedTaxes = taxes.slice(
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
          placeholder="Nombre del impuesto"
          value={newTax.taxName}
          onChange={(e) => setNewTax({ ...newTax, taxName: e.target.value })}
        />
        <Input
          type="number"
          placeholder="Porcentaje"
          value={newTax.percentage}
          onChange={(e) => setNewTax({ ...newTax, percentage: Number(e.target.value) })}
        />
        <Button color="primary" onClick={handleAdd}>Agregar</Button>
      </div>

      <Table hover>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Porcentaje</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTaxes.map((tax, index) => (
            <tr key={index}>
              <td className="w-50">
                {editingIndex === index ? (
                  <Input
                    type="text"
                    value={editingTax.taxName}
                    onChange={(e) => setEditingTax({ ...editingTax, taxName: e.target.value })}
                  />
                ) : (
                  tax.taxName
                )}
              </td>
              <td className="w-25">
                {editingIndex === index ? (
                  <Input
                    type="number"
                    value={editingTax.percentage}
                    onChange={(e) => setEditingTax({ ...editingTax, percentage: Number(e.target.value) })}
                  />
                ) : (
                  tax.percentage
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
        data={taxes}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPageData={itemsPerPage}
      />
    </>
  );
};

export default TaxesTable;
