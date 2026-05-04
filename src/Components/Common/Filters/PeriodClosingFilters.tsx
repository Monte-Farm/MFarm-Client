import { useRef } from "react";
import { FiFilter } from "react-icons/fi";
import Select from "react-select";
import {
    Badge, Button, FormGroup, Label, Popover, PopoverBody, PopoverHeader,
} from "reactstrap";
import { useTranslation } from "react-i18next";

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

const PeriodClosingFilters: React.FC<PeriodClosingFiltersProps> = ({
    filters,
    onFilterChange,
    onClearFilters,
    popoverOpen,
    onTogglePopover,
    yearOptions,
}) => {
    const { t } = useTranslation();
    const filterBtnRef = useRef(null);

    const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

    const statusOptions = [
        { value: "", label: t("finance.periodClosing.filters.status.active") },
        { value: "closed", label: t("finance.periodClosing.filters.status.closed") },
        { value: "reopened", label: t("finance.periodClosing.filters.status.reopened") },
        { value: "archived", label: t("finance.periodClosing.filters.status.archived") },
    ];

    const periodTypeOptions = [
        { value: "", label: t("finance.periodClosing.filters.periodType.all") },
        { value: "monthly", label: t("finance.periodClosing.filters.periodType.monthly") },
        { value: "annual", label: t("finance.periodClosing.filters.periodType.annual") },
    ];

    const yearSelectOptions = [
        { value: "", label: t("finance.periodClosing.filters.allYears") },
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
                {t("finance.periodClosing.filters.button")}
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
                    <span className="text-black">{t("finance.periodClosing.filters.header")}</span>
                    <Button close onClick={onTogglePopover} />
                </PopoverHeader>
                <PopoverBody className="popover-body">
                    <FormGroup>
                        <Label>{t("finance.periodClosing.filters.labelPeriodType")}</Label>
                        <Select
                            options={periodTypeOptions}
                            value={periodTypeOptions.find((opt) => opt.value === filters.periodType)}
                            onChange={(opt: any) => onFilterChange("periodType", opt?.value || "")}
                            className="react-select"
                            classNamePrefix="select"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>{t("finance.periodClosing.filters.labelYear")}</Label>
                        <Select
                            options={yearSelectOptions}
                            value={yearSelectOptions.find((opt) => opt.value === filters.year)}
                            onChange={(opt: any) => onFilterChange("year", opt?.value || "")}
                            className="react-select"
                            classNamePrefix="select"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>{t("finance.periodClosing.filters.labelStatus")}</Label>
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
                            <i className="ri-refresh-line me-1" />{t("common.button.clearFilters")}
                        </Button>
                    </div>
                </PopoverBody>
            </Popover>
        </>
    );
};

export default PeriodClosingFilters;
