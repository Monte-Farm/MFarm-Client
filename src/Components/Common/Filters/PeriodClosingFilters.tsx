import { useRef } from "react";
import { FiFilter } from "react-icons/fi";
import Select from "react-select";
import {
    Badge, Button, FormGroup, Label, Popover, PopoverBody, PopoverHeader,
} from "reactstrap";

export interface PeriodClosingFiltersState {
    year: string;
    status: string;
    periodType: string;
}

interface PeriodClosingFiltersProps {
    filters: PeriodClosingFiltersState;
    onFilterChange: (filterName: keyof PeriodClosingFiltersState, value: string) => void;
    onClearFilters: () => void;
    popoverOpen: boolean;
    onTogglePopover: () => void;
    yearOptions: number[];
}

const statusOptions = [
    { value: "", label: "Activos (cerrados y reabiertos)" },
    { value: "closed", label: "Cerrados" },
    { value: "reopened", label: "Reabiertos" },
    { value: "archived", label: "Archivados" },
];

const periodTypeOptions = [
    { value: "", label: "Todos" },
    { value: "monthly", label: "Mensuales" },
    { value: "annual", label: "Anuales" },
];

const PeriodClosingFilters: React.FC<PeriodClosingFiltersProps> = ({
    filters,
    onFilterChange,
    onClearFilters,
    popoverOpen,
    onTogglePopover,
    yearOptions,
}) => {
    const filterBtnRef = useRef(null);

    const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

    const yearSelectOptions = [
        { value: "", label: "Todos los años" },
        ...yearOptions.map((y) => ({ value: String(y), label: String(y) })),
    ];

    return (
        <>
            <Button
                innerRef={filterBtnRef}
                color="light"
                onClick={onTogglePopover}
                className="d-flex align-items-center position-relative"
            >
                <FiFilter className="me-2" />
                Filtros
                {activeFilterCount > 0 && (
                    <Badge color="primary" pill className="position-absolute top-0 start-100 translate-middle">
                        {activeFilterCount}
                    </Badge>
                )}
            </Button>

            <Popover
                placement="bottom-end"
                isOpen={popoverOpen}
                target={filterBtnRef}
                toggle={onTogglePopover}
                trigger="legacy"
            >
                <PopoverHeader className="d-flex justify-content-between align-items-center popover-header">
                    <span className="text-black">Filtrar cierres</span>
                    <Button close onClick={onTogglePopover} />
                </PopoverHeader>
                <PopoverBody className="popover-body">
                    <FormGroup>
                        <Label>Tipo de periodo</Label>
                        <Select
                            options={periodTypeOptions}
                            value={periodTypeOptions.find((opt) => opt.value === filters.periodType)}
                            onChange={(opt: any) => onFilterChange("periodType", opt?.value || "")}
                            className="react-select"
                            classNamePrefix="select"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Año</Label>
                        <Select
                            options={yearSelectOptions}
                            value={yearSelectOptions.find((opt) => opt.value === filters.year)}
                            onChange={(opt: any) => onFilterChange("year", opt?.value || "")}
                            className="react-select"
                            classNamePrefix="select"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Estado</Label>
                        <Select
                            options={statusOptions}
                            value={statusOptions.find((opt) => opt.value === filters.status)}
                            onChange={(opt: any) => onFilterChange("status", opt?.value || "")}
                            className="react-select"
                            classNamePrefix="select"
                        />
                    </FormGroup>
                    <div className="d-flex justify-content-end">
                        <Button color="danger" size="sm" onClick={onClearFilters} disabled={activeFilterCount === 0}>
                            <i className="ri-refresh-line me-1" />Limpiar filtros
                        </Button>
                    </div>
                </PopoverBody>
            </Popover>
        </>
    );
};

export default PeriodClosingFilters;
