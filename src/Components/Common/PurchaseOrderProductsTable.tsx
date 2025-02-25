import React, { useEffect, useState, useMemo } from "react";
import { Input, Table } from "reactstrap";
import SimpleBar from "simplebar-react";

interface PurchaseOrderProductsTableProps {
    data: any[];
    productsDelivered: Array<{ id: string; quantity: number; price: number }>;
    onProductEdit: (updatedProducts: Array<{ id: string; quantity: number; price: number }>) => void;
}

const PurchaseOrderProductsTable: React.FC<PurchaseOrderProductsTableProps> = ({ data, productsDelivered, onProductEdit }) => {
    const [filterText, setFilterText] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [editingValues, setEditingValues] = useState<Record<string, { quantity: string; price: string }>>({});

    useEffect(() => {
        const initialValues = Object.fromEntries(
            productsDelivered.map(({ id, quantity, price }) => [id, { quantity: quantity.toString(), price: price.toString() }])
        );
        setEditingValues(initialValues);
    }, [productsDelivered]);

    const handleInputChange = (id: string, field: "quantity" | "price", value: string) => {
        const cleanedValue = value.replace(/^0+/, "") || "0";
        const parsedValue = Math.max(parseFloat(cleanedValue) || 0, 0);

        setEditingValues(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: parsedValue.toString() }
        }));

        const updatedProducts = productsDelivered.map(p => (p.id === id ? { ...p, [field]: parsedValue } : p));
        onProductEdit(updatedProducts);
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            return sortConfig.direction === "asc"
                ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
                : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
        });
    }, [data, sortConfig]);

    const requestSort = (key: string) => {
        setSortConfig(prev => (prev?.key === key && prev.direction === "asc" ? { key, direction: "desc" } : { key, direction: "asc" }));
    };

    const filteredData = sortedData
        .filter(product => productsDelivered.some(p => p.id === product.id)) // Filtra solo los productos que están en productsDelivered
        .filter(product => {
            const filter = filterText.toLowerCase();
            return ["id", "name", "category", "unit_measurement"].some(key => product[key]?.toLowerCase().includes(filter));
        });

    return (
        <div className="table-responsive">
            <div className="d-flex justify-content-between mb-3">
                <Input type="text" placeholder="Buscar..." value={filterText} onChange={e => setFilterText(e.target.value)} />
            </div>

            <SimpleBar style={{ height: "500px" }}>
                <Table className="table-hover align-middle table-nowrap mb-0" striped>
                    <thead className="table-light sticky-top">
                        <tr>
                            {["id", "name", "category", "unit_measurement", "requested_quantity", "quantity", "price"].map(key => (
                                <th key={key} onClick={() => requestSort(key)} style={{ cursor: "pointer" }}>
                                    {key === "requested_quantity" ? "Cantidad Solicitada" :
                                        key === "id" ? "Código" :
                                            key === "name" ? "Nombre" :
                                                key === "category" ? "Categoría" :
                                                    key === "unit_measurement" ? "Unidad de Medida" :
                                                        key === "quantity" ? "Cantidad" :
                                                            key === "price" ? "Precio" :
                                                                key.charAt(0).toUpperCase() + key.slice(1)}
                                    {sortConfig?.key === key ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map(({ id, name, category, unit_measurement }) => {
                                const productDelivered = productsDelivered.find(p => p.id === id);
                                return (
                                    <tr key={id}>
                                        <td>{id}</td>
                                        <td>{name}</td>
                                        <td>{category}</td>
                                        <td>{unit_measurement}</td>
                                        <td>{productDelivered?.quantity || "0"}</td> {/* Cantidad solicitada */}
                                        <td>
                                            <Input type="number" value={editingValues[id]?.quantity || "0"} onChange={e => handleInputChange(id, "quantity", e.target.value)} min={0} />
                                        </td>
                                        <td>
                                            <Input type="number" value={editingValues[id]?.price || "0"} onChange={e => handleInputChange(id, "price", e.target.value)} min={0} />
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
