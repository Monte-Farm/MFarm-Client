import React, { useEffect, useState } from "react";
import { Input, Table } from "reactstrap";
import SimpleBar from "simplebar-react";

interface PurchaseOrderProductsTableProps {
    data: any[];
    productsDelivered: Array<{ id: string; quantity: number; price: number }>;
    onProductEdit: (updatedProducts: Array<{ id: string; quantity: number; price: number }>) => void;
}

const PurchaseOrderProductsTable: React.FC<PurchaseOrderProductsTableProps> = ({ data, productsDelivered, onProductEdit }) => {
    const [filterText, setFilterText] = useState<string>("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    // Estado para manejar los valores de los inputs
    const [editingValues, setEditingValues] = useState<Record<string, { quantity: string; price: string }>>({});

    // Inicializar editingValues con los valores de productsDelivered
    useEffect(() => {
        const initialValues: Record<string, { quantity: string; price: string }> = {};
        productsDelivered.forEach((product) => {
            initialValues[product.id] = {
                quantity: product.quantity.toString(),
                price: product.price.toString(),
            };
        });
        setEditingValues(initialValues);
    }, [productsDelivered]);

    // Maneja el cambio en la cantidad o el precio de un producto
    const handleInputChange = (id: string, field: "quantity" | "price", value: string) => {
        let cleanedValue = value.replace(/^0+/, ""); // Elimina ceros iniciales

        if (cleanedValue === "") cleanedValue = "0"; // Si el usuario borra todo, queda "0"

        let parsedValue = parseFloat(cleanedValue); // Usamos parseFloat para manejar decimales en el precio
        if (isNaN(parsedValue)) parsedValue = 0;

        // Validación: No permitir valores menores que 0
        if (parsedValue < 0) parsedValue = 0;

        // Actualiza el estado del input
        setEditingValues((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: parsedValue.toString(),
            },
        }));

        // Actualiza la lista de productos entregados
        const updatedProducts = productsDelivered.map((p) =>
            p.id === id
                ? {
                    ...p,
                    [field]: parsedValue,
                }
                : p
        );
        onProductEdit(updatedProducts);
    };

    // Obtiene el valor de un input (quantity o price)
    const getInputValue = (id: string, field: "quantity" | "price") => {
        if (editingValues[id]?.[field] !== undefined) return editingValues[id][field];
        return productsDelivered.find((p) => p.id === id)?.[field].toString() || "0";
    };

    // Función para ordenar los datos
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

    // Función para manejar el clic en los encabezados de la tabla
    const requestSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    // Filtra los productos según el texto de búsqueda
    const filteredData = sortedData.filter((product) => {
        const filter = filterText.toLowerCase();
        return (
            product.id.toLowerCase().includes(filter) ||
            product.name.toLowerCase().includes(filter) ||
            product.category.toLowerCase().includes(filter) ||
            product.unit_measurement.toLowerCase().includes(filter)
        );
    });

    return (
        <div className="table-responsive">
            <div className="d-flex justify-content-between mb-3">
                <Input
                    type="text"
                    placeholder="Buscar por Producto, Categoría o Unidad de medida..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>

            <SimpleBar style={{ height: "500px" }}>
                <Table className="table-hover align-middle table-nowrap mb-0" striped>
                    <thead className="table-light sticky-top">
                        <tr>
                            <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }}>
                                Código {sortConfig?.key === "id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }}>
                                Producto {sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th onClick={() => requestSort("category")} style={{ cursor: "pointer" }}>
                                Categoría {sortConfig?.key === "category" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th onClick={() => requestSort("quantity")} style={{ cursor: "pointer" }}>
                                Cantidad {sortConfig?.key === "quantity" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th onClick={() => requestSort("unit_measurement")} style={{ cursor: "pointer" }}>
                                Unidad de Medida {sortConfig?.key === "unit_measurement" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th onClick={() => requestSort("price")} style={{ cursor: "pointer" }}>
                                Precio Unitario {sortConfig?.key === "price" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((product) => {
                                const deliveredProduct = productsDelivered.find((p) => p.id === product.id);
                                return (
                                    <tr key={product.id}>
                                        <td>{product.id}</td>
                                        <td>{product.name}</td>
                                        <td>{product.category}</td>
                                        <td>
                                            <Input
                                                type="number"
                                                value={getInputValue(product.id, "quantity")}
                                                onChange={(e) => handleInputChange(product.id, "quantity", e.target.value)}
                                                min={0} // Solo permite valores mayores o iguales a 0
                                            />
                                        </td>
                                        <td>{product.unit_measurement}</td>
                                        <td>
                                            <Input
                                                type="number"
                                                value={getInputValue(product.id, "price")}
                                                onChange={(e) => handleInputChange(product.id, "price", e.target.value)}
                                                min={0} // Solo permite valores mayores o iguales a 0
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center">
                                    No hay productos disponibles.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </SimpleBar>
        </div>
    );
};

export default PurchaseOrderProductsTable;