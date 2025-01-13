import React, { useEffect } from "react";
import { Input } from "reactstrap";

type Column<T> = {
    header: string;
    accessor: keyof T;
    isFilterable?: boolean;
    options?: { label: string; value: any }[];
};

interface TableFilterProps<T> {
    columns: Column<T>[];
    filterText: string;
    selectedFilter: keyof T | "";
    onFilterTextChange: (text: string) => void;
    onFilterChange: (filter: keyof T | "") => void;
    defaultFilterField?: keyof T;
}

const TableFilter = <T,>({
    columns,
    filterText,
    selectedFilter,
    onFilterTextChange,
    onFilterChange,
    defaultFilterField,
}: TableFilterProps<T>) => {

    useEffect(() => {
        if (defaultFilterField && selectedFilter === "") {
            onFilterChange(defaultFilterField); // Configura el filtro predeterminado si no se ha seleccionado uno
        }
    }, [defaultFilterField, selectedFilter, onFilterChange]);


    // Limpiar el filtro de texto si cambiamos de un filtro con opciones a uno de texto
    useEffect(() => {
        const selectedColumn = columns.find((col) => col.accessor === selectedFilter);
        if (
            selectedColumn &&
            !selectedColumn.options &&
            filterText !== ""
        ) {
            onFilterTextChange(""); // Limpiar el filtro si cambiamos a una columna sin opciones
        }
    }, [selectedFilter, columns, onFilterTextChange]);

    const renderFilterInput = () => {
        const selectedColumn = columns.find((col) => col.accessor === selectedFilter);

        if (selectedColumn && selectedColumn.options) {
            return (
                <Input
                    type="select"
                    className="form-control w-75"
                    value={filterText}
                    onChange={(e) => onFilterTextChange(e.target.value)}
                >
                    <option value="">Todo</option>
                    {selectedColumn.options.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Input>
            );
        }

        return (
            <Input
                type="text"
                className="form-control w-75"
                placeholder="Buscar..."
                value={filterText}
                onChange={(e) => onFilterTextChange(e.target.value)}
            />
        );
    };

    return (
        <div className="d-flex align-items-center gap-2">
            {renderFilterInput()}

            <Input
                type="select"
                className="form-control w-25"
                value={selectedFilter as string}
                onChange={(e) => onFilterChange(e.target.value as keyof T | "")}
            >
                {columns
                    .filter((col) => col.isFilterable)
                    .map((col, index) => (
                        <option key={index} value={col.accessor as string}>
                            {col.header}
                        </option>
                    ))}
            </Input>
        </div>
    );
};

export default TableFilter;
