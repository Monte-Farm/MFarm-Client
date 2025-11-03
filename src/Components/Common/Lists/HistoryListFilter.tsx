import { useState, useRef, useContext, useEffect } from "react";
import { ConfigContext } from "App";
import { Button, Input, Badge, Popover, PopoverHeader, PopoverBody, Row, Col, FormGroup, Label } from "reactstrap";
import Select from "react-select";
import { FiFilter, FiX, FiSearch } from "react-icons/fi";

interface ReproductionHistoryItem {
    type: string;
    date: string;
    responsible?: { name: string; lastname: string };
    [key: string]: any;
}

interface ReproductionFiltersProps {
    history: ReproductionHistoryItem[];
    setFilteredHistory: (filtered: ReproductionHistoryItem[]) => void;
}

const ReproductionFilters: React.FC<ReproductionFiltersProps> = ({ history, setFilteredHistory }) => {
    const configContext = useContext(ConfigContext);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        dateRange: [null, null] as [Date | null, Date | null],
        type: "",
    });
    const [popoverOpen, setPopoverOpen] = useState(false);
    const filterBtnRef = useRef(null);

    const togglePopover = () => setPopoverOpen(!popoverOpen);

    const typeOptions = [
        { value: "", label: "Todos" },
        { value: "celo", label: "Celo" },
        { value: "inseminacion", label: "Inseminación" },
        { value: "parto", label: "Parto" },
        { value: "aborto", label: "Aborto" }
    ];

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDateChange = (index: 0 | 1, value: string) => {
        const newRange: [Date | null, Date | null] = [...filters.dateRange];
        newRange[index] = value ? new Date(value) : null;
        setFilters(prev => ({ ...prev, dateRange: newRange }));
    };

    const applyFilters = () => {
        let result = [...history];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.responsible
                    ? `${item.responsible.name} ${item.responsible.lastname}`.toLowerCase().includes(term)
                    : false
            );
        }

        if (filters.type) result = result.filter(item => item.type === filters.type);
        if (filters.dateRange[0]) result = result.filter(item => new Date(item.date) >= filters.dateRange[0]!);
        if (filters.dateRange[1]) result = result.filter(item => new Date(item.date) <= filters.dateRange[1]!);

        setFilteredHistory(result);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setFilters({
            dateRange: [null, null],
            type: ""
        });
        setPopoverOpen(false);
        setFilteredHistory([...history]);
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== "" && !(Array.isArray(v) && v[0] === null && v[1] === null)).length;

    useEffect(() => {
        applyFilters();
    }, [filters, searchTerm]);

    return (
        <div className="d-flex gap-3 mb-1 flex-wrap ms-3 mt-3">
            <div className="position-relative">
                <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Input
                    type="text"
                    placeholder="Buscar responsable..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control ps-5"
                    style={{ width: '500px' }}
                />
            </div>

            <Button innerRef={filterBtnRef} color="light" onClick={togglePopover} className="position-relative">
                <FiFilter className="me-2" /> Filtros
                {activeFilterCount > 0 && <Badge color="primary" pill className="position-absolute top-0 start-100 translate-middle">{activeFilterCount}</Badge>}
            </Button>

            {activeFilterCount > 0 && <Button color="link" onClick={clearFilters} className="text-danger"><FiX className="me-1" /> Limpiar filtros</Button>}

            <Popover
                placement="bottom-end"
                isOpen={popoverOpen}
                target={filterBtnRef}
                toggle={togglePopover}
                trigger="legacy"
                className="filter-popover"
                style={{ minWidth: "350px" }}
            >
                <PopoverHeader className="d-flex justify-content-between align-items-center">
                    <span className="text-black">Filtros reproductivos</span>
                    <Button close onClick={togglePopover} />
                </PopoverHeader>
                <PopoverBody>

                    <FormGroup className="mb-3">
                        <Label>Tipo de evento</Label>
                        <Select
                            options={typeOptions}
                            value={typeOptions.find(opt => opt.value === filters.type)}
                            onChange={(opt: any) => handleFilterChange("type", opt?.value || "")}
                        />
                    </FormGroup>

                    <div className="d-flex gap-3">
                        <FormGroup className="w-50">
                            <Label>Fecha desde</Label>
                            <Input type="date" value={filters.dateRange[0] ? filters.dateRange[0].toISOString().split('T')[0] : ""} onChange={e => handleDateChange(0, e.target.value)} />
                        </FormGroup>
                        <FormGroup className="w-50">
                            <Label>Fecha hasta</Label>
                            <Input type="date" value={filters.dateRange[1] ? filters.dateRange[1].toISOString().split('T')[0] : ""} onChange={e => handleDateChange(1, e.target.value)} />
                        </FormGroup>
                    </div>




                    <div className="d-flex justify-content-between mt-3">
                        <Button color="link" onClick={clearFilters} className="text-danger"><FiX className="me-1" /> Limpiar todo</Button>
                        <Button color="primary" onClick={togglePopover}>Aplicar filtros</Button>
                    </div>
                </PopoverBody>
            </Popover>
        </div>
    );
};

export default ReproductionFilters;