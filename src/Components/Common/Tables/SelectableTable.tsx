import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Table, Input, Label } from "reactstrap";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Column, ColumnType } from "common/data/data_types";
import Pagination from "./Pagination";

type SelectionMode = "single" | "multiple";

type SelectableCustomTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    selectionMode?: SelectionMode;
    onSelect?: (selected: T[]) => void;
    showSearchAndFilter?: boolean;
    rowClickable?: boolean;
    onRowClick?: (row: T) => void;
    rowsPerPage?: number;
    showPagination?: boolean;
    className?: string;
    disabled?: boolean;
    resetSelectionTrigger?: any;
};

const formatValue = (value: any, type?: ColumnType) => {
    if (value == null) return "";
    switch (type) {
        case "number":
            return new Intl.NumberFormat().format(value);
        case "date":
            return new Date(value).toLocaleDateString();
        case "currency":
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(value);
        default:
            return value.toString();
    }
};

function SelectableCustomTable<T extends { id: string }>({
    columns,
    data,
    selectionMode = "multiple",
    onSelect,
    showSearchAndFilter = true,
    rowClickable = false,
    onRowClick,
    rowsPerPage = 10,
    showPagination = true,
    className = "",
    disabled = false,
    resetSelectionTrigger, // 👈 nuevo prop
}: SelectableCustomTableProps<T>) {
    const [filterText, setFilterText] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // 👇 efecto para reiniciar selección cuando cambie el trigger
    useEffect(() => {
        setSelectedIds(new Set());
        onSelect?.([]);
    }, [resetSelectionTrigger]);

    // Filtrado
    const filteredData = useMemo(() => {
        if (!filterText) return data;
        return data.filter((row) =>
            columns.some(
                (col) =>
                    col.isFilterable &&
                    String(row[col.accessor])
                        .toLowerCase()
                        .includes(filterText.toLowerCase())
            )
        );
    }, [filterText, data, columns]);

    // Ordenamiento
    const [sortConfig, setSortConfig] = useState<{
        key: keyof T;
        direction: "asc" | "desc";
    } | null>(null);

    const sortedData = useMemo(() => {
        const sortable = [...filteredData];
        if (sortConfig) {
            sortable.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key])
                    return sortConfig.direction === "asc" ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key])
                    return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [filteredData, sortConfig]);

    const requestSort = (key: keyof T) => {
        setSortConfig((prev) =>
            prev && prev.key === key && prev.direction === "asc"
                ? { key, direction: "desc" }
                : { key, direction: "asc" }
        );
    };

    // Paginación
    const paginatedData = useMemo(() => {
        if (!showPagination) return sortedData;
        const start = (currentPage - 1) * rowsPerPage;
        return sortedData.slice(start, start + rowsPerPage);
    }, [sortedData, currentPage, rowsPerPage, showPagination]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    // Selección
    const handleSelectionChange = useCallback(
        (row: T, checked: boolean) => {
            if (disabled) return;
            const newSelected = new Set(selectedIds);

            if (selectionMode === "single") {
                newSelected.clear();
                newSelected.add(row.id);
            } else {
                if (checked) newSelected.add(row.id);
                else newSelected.delete(row.id);
            }

            setSelectedIds(newSelected);
            const selectedItems = data.filter((d) => newSelected.has(d.id));
            onSelect?.(selectedItems);
        },
        [selectedIds, selectionMode, data, onSelect, disabled]
    );

    const toggleSelectAll = useCallback(() => {
        if (disabled) return;
        if (selectedIds.size === paginatedData.length) {
            setSelectedIds(new Set());
            onSelect?.([]);
        } else {
            const newSelected = new Set(paginatedData.map((d) => d.id));
            setSelectedIds(newSelected);
            onSelect?.(data.filter((d) => newSelected.has(d.id)));
        }
    }, [selectedIds, paginatedData, data, onSelect, disabled]);

    const handlePageChange = (page: number) => setCurrentPage(page);

    return (
        <div
            style={{
                pointerEvents: disabled ? "none" : "auto",
                opacity: disabled ? 0.5 : 1,
            }}
        >
            {showSearchAndFilter && (
                <div className="d-flex justify-content-between mb-3">
                    <Input
                        type="text"
                        placeholder="Buscar..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        disabled={disabled}
                    />
                </div>
            )}

            <SimpleBar style={{ maxHeight: "60vh" }}>
                <Table className={`table-hover align-middle table-nowrap mb-0 ${className}`}>
                    <thead className="table-light sticky-top">
                        <tr>
                            <th style={{ width: 50 }}>
                                {selectionMode === "multiple" && paginatedData.length > 0 && (
                                    <Input
                                        type="checkbox"
                                        checked={selectedIds.size === paginatedData.length}
                                        onChange={toggleSelectAll}
                                        disabled={disabled}
                                    />
                                )}
                            </th>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    onClick={() => requestSort(col.accessor)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {col.header}{" "}
                                    {sortConfig?.key === col.accessor
                                        ? sortConfig.direction === "asc"
                                            ? "▲"
                                            : "▼"
                                        : ""}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row) => {
                                const isSelected = selectedIds.has(row.id);
                                return (
                                    <tr
                                        key={row.id}
                                        className={isSelected ? "table-primary" : ""}
                                        style={{ cursor: rowClickable ? "pointer" : "default" }}
                                        onClick={() => {
                                            if (!disabled && (rowClickable || selectionMode))
                                                handleSelectionChange(row, !isSelected);
                                            if (!disabled && rowClickable && onRowClick)
                                                onRowClick(row);
                                        }}
                                    >
                                        <td>
                                            <Label check className="d-block m-0 p-0">
                                                <Input
                                                    type={
                                                        selectionMode === "single" ? "radio" : "checkbox"
                                                    }
                                                    name={
                                                        selectionMode === "single" ? "selectRow" : undefined
                                                    }
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectionChange(row, e.target.checked);
                                                    }}
                                                    disabled={disabled}
                                                />
                                            </Label>
                                        </td>
                                        {columns.map((col, cIdx) => (
                                            <td key={cIdx}>
                                                {col.render
                                                    ? col.render(row[col.accessor], row)
                                                    : formatValue(row[col.accessor], col.type)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 1} className="text-center">
                                    No se encontraron datos
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </SimpleBar>

            {showPagination && totalPages > 1 && (
                <div className="mt-3">
                    <Pagination
                        data={filteredData}
                        currentPage={currentPage}
                        setCurrentPage={handlePageChange}
                        perPageData={rowsPerPage}
                    />
                </div>
            )}
        </div>
    );
}

export default SelectableCustomTable;