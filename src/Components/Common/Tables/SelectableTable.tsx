import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiInbox } from "react-icons/fi";
import { useSelector } from "react-redux";
import { Table, Input, Label } from "reactstrap";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Column, ColumnType } from "common/data/data_types";
import Pagination from "./Pagination";
import { darkenHex } from "utils/colorUtils";

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
    onChangeRow?: (updatedRow: T) => void; // NUEVO opcional
    selectionOnlyOnCheckbox?: boolean; // NUEVO: para controlar si la selección solo funciona con checkbox
    initialSelectedIds?: string[]; // Preselección inicial (útil al editar)
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

function SelectableCustomTable<T extends { id?: string }>(props: SelectableCustomTableProps<T>) {
    const {
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
        resetSelectionTrigger,
        onChangeRow,
        selectionOnlyOnCheckbox = false,
        initialSelectedIds,
    } = props;

    const getRowId = (row: T): string => (row as any)._id ?? row.id ?? "";

    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const resolveBg = (color?: string) => color ? (isDark ? darkenHex(color) : color) : undefined;
    const [filterText, setFilterText] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isFirstResetRun = React.useRef(true);
    useEffect(() => {
        if (isFirstResetRun.current) {
            isFirstResetRun.current = false;
            return;
        }
        setSelectedIds(new Set());
        onSelect?.([]);
    }, [resetSelectionTrigger]);

    // Aplica la preselección inicial cuando llegan datos y/o cambian los IDs preseleccionados.
    useEffect(() => {
        if (!initialSelectedIds || initialSelectedIds.length === 0) return;
        if (data.length === 0) return;
        const validIds = new Set(
            initialSelectedIds.filter(id => data.some((row) => getRowId(row) === id))
        );
        if (validIds.size === 0) return;
        setSelectedIds(validIds);
        const selectedRows = data.filter((row) => validIds.has(getRowId(row)));
        onSelect?.(selectedRows);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, initialSelectedIds?.join(",")]);

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

    const [sortConfig, setSortConfig] = useState<{
        key: keyof T;
        direction: "asc" | "desc";
    } | null>(null);

    const sortedData = useMemo(() => {
        const sortable = [...filteredData];
        if (sortConfig) {
            sortable.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
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

    const paginatedData = useMemo(() => {
        if (!showPagination) return sortedData;
        const start = (currentPage - 1) * rowsPerPage;
        return sortedData.slice(start, start + rowsPerPage);
    }, [sortedData, currentPage, rowsPerPage, showPagination]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const handleSelectionChange = useCallback(
        (row: T, checked: boolean) => {
            if (disabled) return;
            const newSelected = new Set(selectedIds);

            if (selectionMode === "single") {
                newSelected.clear();
                newSelected.add(getRowId(row));
            } else {
                if (checked) newSelected.add(getRowId(row));
                else newSelected.delete(getRowId(row));
            }

            setSelectedIds(newSelected);
            const selectedItems = data.filter((d) => newSelected.has(getRowId(d)));
            onSelect?.(selectedItems);
        },
        [selectedIds, selectionMode, data, onSelect, disabled]
    );

    const toggleSelectAll = useCallback(() => {
        if (disabled) return;

        const visibleIds = new Set(sortedData.map((row) => getRowId(row)));
        const areAllVisibleRowsSelected = sortedData.length > 0 && sortedData.every((row) => selectedIds.has(getRowId(row)));
        const newSelected = new Set(selectedIds);

        if (areAllVisibleRowsSelected) {
            visibleIds.forEach((id) => newSelected.delete(id));
        } else {
            visibleIds.forEach((id) => newSelected.add(id));
        }

        setSelectedIds(newSelected);
        onSelect?.(data.filter((row) => newSelected.has(getRowId(row))));
    }, [selectedIds, sortedData, data, onSelect, disabled]);

    const handlePageChange = (page: number) => setCurrentPage(page);

    // NUEVO: actualizar valores de inputs por fila
    const handleFieldChange = (id: string, field: keyof T, value: any) => {
        const updated = data.map((item) =>
            getRowId(item) === id ? { ...item, [field]: value } : item
        );

        const updatedRow = updated.find((x) => getRowId(x) === id);
        if (updatedRow && onChangeRow) onChangeRow(updatedRow);
    };

    if (data.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    color: "#888",
                    padding: "48px 0",
                }}
            >
                <div>
                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                    <div style={{ fontSize: 16 }}>{t("shared.table.noData")}</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.5 : 1 }}>
            {showSearchAndFilter && (
                <div className="d-flex justify-content-between mb-3">
                    <Input
                        type="text"
                        placeholder={t("shared.table.search")}
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
                            <th style={{ width: selectionOnlyOnCheckbox ? 60 : 50 }}>
                                {selectionMode === "multiple" && (
                                    <Input
                                        type="checkbox"
                                        checked={sortedData.length > 0 && sortedData.every((row) => selectedIds.has(getRowId(row)))}
                                        onChange={toggleSelectAll}
                                        disabled={disabled}
                                        style={selectionOnlyOnCheckbox ? { transform: 'scale(1.2)' } : {}}
                                    />
                                )}
                            </th>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    onClick={() => requestSort(col.accessor)}
                                    style={{
                                        cursor: "pointer",
                                        backgroundColor: resolveBg(col.bgColor),
                                        ...(col.type === "currency" && { width: "1%", whiteSpace: "nowrap" })
                                    }}
                                >
                                    {col.header}{" "}
                                    {sortConfig?.key === col.accessor ? (
                                        sortConfig.direction === "asc" ? "▲" : "▼"
                                    ) : (
                                        ""
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row) => {
                            const isSelected = selectedIds.has(getRowId(row));
                            return (
                                <tr
                                    key={getRowId(row)}
                                    className={isSelected ? "table-primary" : ""}
                                    style={{ cursor: (rowClickable || !selectionOnlyOnCheckbox) ? "pointer" : "default" }}
                                    onClick={() => {
                                        if (!disabled && !selectionOnlyOnCheckbox && (rowClickable || selectionMode))
                                            handleSelectionChange(row, !isSelected);
                                        if (!disabled && rowClickable && onRowClick)
                                            onRowClick(row);
                                    }}
                                >
                                    <td>
                                        <Label check className="d-block m-0 p-0">
                                            <Input
                                                type={selectionMode === "single" ? "radio" : "checkbox"}
                                                name={selectionMode === "single" ? "selectRow" : undefined}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectionChange(row, e.target.checked);
                                                }}
                                                disabled={disabled}
                                                style={selectionOnlyOnCheckbox ? { transform: 'scale(1.2)' } : {}}
                                            />
                                        </Label>
                                    </td>
                                    {columns.map((col, cIdx) => (
                                        <td key={cIdx} style={{
                                            backgroundColor: resolveBg(col.bgColor),
                                            textAlign: col.type === "currency" ? "right" : "left",
                                            ...(col.type === "currency" && { whiteSpace: "nowrap" })
                                        }}>
                                            {col.render
                                                ? col.render(
                                                      row[col.accessor],
                                                      row,
                                                      isSelected,
                                                      (field: keyof T, value: any) =>
                                                          handleFieldChange(getRowId(row), field, value)
                                                  )
                                                : formatValue(row[col.accessor], col.type)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
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
