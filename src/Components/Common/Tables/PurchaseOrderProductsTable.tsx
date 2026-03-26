import { categoryLabels } from "common/product_categories";
import React, { useEffect, useState, useMemo } from "react";
import { Input, Table } from "reactstrap";
import SimpleBar from "simplebar-react";

interface PurchaseOrderProductsTableProps {
    data: any[];
    productsDelivered: Array<{ id: string; quantity: number; price: number; totalPrice?: number }>;
    onProductEdit: (updatedProducts: Array<{ id: string; quantity: number; price: number; totalPrice?: number }>) => void;
}

const PurchaseOrderProductsTable: React.FC<PurchaseOrderProductsTableProps> = ({ data, productsDelivered, onProductEdit }) => {
    const [filterText, setFilterText] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const [editingValues, setEditingValues] = useState<Record<string, { quantity: string; price: string; totalPrice: string }>>({});

    useEffect(() => {
        const initialValues = Object.fromEntries(
            productsDelivered.map(({ id, quantity, price, totalPrice }) => [
                id, 
                { 
                    quantity: quantity.toString(), 
                    price: price.toString(),
                    totalPrice: (totalPrice || 0).toString()
                }
            ])
        );
        // Solo actualizar si los IDs cambian, no los valores
        setEditingValues(prev => {
            const prevIds = Object.keys(prev).sort().join(',');
            const newIds = productsDelivered.map(p => p.id).sort().join(',');
            return prevIds === newIds ? prev : initialValues;
        });
    }, [productsDelivered]);

    const handleInputChange = (id: string, field: "quantity" | "price" | "totalPrice", value: string) => {
        const cleanedValue = value.replace(/^0+/, "") || "0";
        const parsedValue = Math.max(parseFloat(cleanedValue) || 0, 0);

        const currentProduct = productsDelivered.find(p => p.id === id);
        if (!currentProduct) return;
        
        let updatedProduct = { ...currentProduct, [field]: parsedValue };

        // Cálculo bidireccional
        if (field === "quantity" || field === "price") {
            // Si cambia cantidad o precio unitario, calcular precio total
            const quantity = field === "quantity" ? parsedValue : (currentProduct.quantity || 0);
            const price = field === "price" ? parsedValue : (currentProduct.price || 0);
            updatedProduct.totalPrice = quantity * price;
            updatedProduct.price = price;
        } else if (field === "totalPrice") {
            // Si cambia precio total, calcular precio unitario
            const quantity = currentProduct.quantity || 0;
            const price = quantity > 0 ? parsedValue / quantity : 0;
            updatedProduct.price = price;
        }

        setEditingValues(prev => ({
            ...prev,
            [id]: { 
                quantity: updatedProduct.quantity?.toString() || "0",
                price: updatedProduct.price?.toString() || "0",
                totalPrice: updatedProduct.totalPrice?.toString() || "0"
            }
        }));

        const updatedProducts = productsDelivered.map(p => (p.id === id ? updatedProduct : p));
        onProductEdit(updatedProducts);
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            const aValue = sortConfig.key === 'id' ? a.id.id : a[sortConfig.key];
            const bValue = sortConfig.key === 'id' ? b.id.id : b[sortConfig.key];
            return sortConfig.direction === "asc"
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });
    }, [data, sortConfig]);

    const requestSort = (key: string) => {
        setSortConfig(prev => (prev?.key === key && prev.direction === "asc" ? { key, direction: "desc" } : { key, direction: "asc" }));
    };

    const filteredData = sortedData
        .filter(product => productsDelivered.some(p => p.id === product.id._id)) // Filtra solo los productos que están en productsDelivered
        .filter(product => {
            const filter = filterText.toLowerCase();
            return ["id.id", "id.name", "id.category", "id.unit_measurement"].some(key => {
                const value = key.split('.').reduce((obj, k) => obj?.[k], product);
                return value?.toLowerCase().includes(filter);
            });
        });

    return (
        <div className="table-responsive">

            <Table className="table-hover align-middle table-nowrap mb-0" striped style={{ overflowY: 'auto' }}>
                <thead className="table-light sticky-top">
                    <tr>
                        {["id", "name", "category", "requested_quantity", "quantity", "price", "totalPrice"].map(key => (
                            <th key={key} onClick={() => requestSort(key)} style={{ cursor: "pointer", backgroundColor: key === "quantity" ? "#f0f0ff" : key === "price" ? "#e6f0ff" : key === "totalPrice" ? "#e6ffe6" : "" }}>
                                {key === "requested_quantity" ? "Cantidad Solicitada" :
                                    key === "id" ? "Código" :
                                        key === "name" ? "Nombre" :
                                            key === "category" ? "Categoría" :
                                                key === "quantity" ? "Cantidad" :
                                                    key === "price" ? "Precio Unitario" :
                                                        key === "totalPrice" ? "Precio Total" :
                                                            key.charAt(0).toUpperCase() + key.slice(1)}
                                {sortConfig?.key === key ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.length > 0 ? (
                        filteredData.map((product) => {
                            const { id: productInfo, quantity: requestedQuantity, price: requestedPrice } = product;
                            const productDelivered = productsDelivered.find(p => p.id === productInfo._id);
                            return (
                                <tr key={productInfo._id}>
                                    <td>{productInfo.id}</td>
                                    <td>{productInfo.name}</td>
                                    <td>{categoryLabels[productInfo.category]}</td>
                                    <td>{requestedQuantity || "0"} {productInfo.unit_measurement}</td>
                                    <td style={{ backgroundColor: "#f0f0ff" }}>
                                        <div className="input-group">
                                            <Input
                                                type="number"
                                                name={`quantity-${productInfo._id}`}
                                                value={editingValues[productInfo._id]?.quantity || "0"}
                                                onChange={e => handleInputChange(productInfo._id, "quantity", e.target.value)}
                                                min={0}
                                                aria-describedby="unit-addon"
                                            />
                                            <span className="input-group-text" id="unit-addon">{productInfo.unit_measurement}</span>
                                        </div>
                                    </td>
                                    <td style={{ backgroundColor: "#e6f0ff" }}>
                                        <div className="input-group">
                                            <span className="input-group-text">$</span>
                                            <Input
                                                type="number"
                                                name={`price-${productInfo._id}`}
                                                value={editingValues[productInfo._id]?.price || "0"}
                                                onChange={e => handleInputChange(productInfo._id, "price", e.target.value)}
                                                min={0}
                                                step="0.01"
                                            />
                                        </div>
                                    </td>
                                    <td style={{ backgroundColor: "#e6ffe6" }}>
                                        <div className="input-group">
                                            <span className="input-group-text">$</span>
                                            <Input
                                                type="number"
                                                name={`totalPrice-${productInfo._id}`}
                                                value={editingValues[productInfo._id]?.totalPrice || "0"}
                                                onChange={e => handleInputChange(productInfo._id, "totalPrice", e.target.value)}
                                                min={0}
                                                step="0.01"
                                            />
                                        </div>
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
        </div>
    );
};

export default PurchaseOrderProductsTable;