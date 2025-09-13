import { useState, useEffect, useRef, useContext } from "react";
import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { Button, Card, CardBody, CardHeader, Container, Input, Popover, PopoverHeader, PopoverBody, Row, Col, FormGroup, Label, Badge } from "reactstrap";
import Select from "react-select";
import Slider from "rc-slider";
import 'rc-slider/assets/index.css';
import CustomTable from "Components/Common/CustomTable";
import { Column } from "common/data/data_types";
import { FiFilter, FiX, FiSearch } from "react-icons/fi";

const InseminationFilters = ({ inseminations, setFilteredInseminations }: { inseminations: any[], setFilteredInseminations: Function }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        dosesRange: [0, 10] as [number, number],
        dateRange: [null, null] as [Date | null, Date | null],
        status: "",
        result: "",
        estimatedFarrowingDateRange: [null, null] as [Date | null, Date | null]
    });
    const [popoverOpen, setPopoverOpen] = useState(false);
    const filterBtnRef = useRef(null);

    const togglePopover = () => setPopoverOpen(!popoverOpen);

    const statusOptions = [
        { value: "", label: "Todos" },
        { value: "active", label: "Activa" },
        { value: "completed", label: "Completada" },
        { value: "failed", label: "Fallida" }
    ];

    const resultOptions = [
        { value: "", label: "Todos" },
        { value: "pregnant", label: "Preñada" },
        { value: "empty", label: "Vacía" },
        { value: "doubtful", label: "Dudosa" },
        { value: "resorption", label: "Reabsorción" },
        { value: "abortion", label: "Aborto" },
        { value: null, label: "Pendiente" }
    ];

    const handleFilterChange = (filterName: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const handleRangeChange = (filterName: string, value: number | number[]) => {
        if (Array.isArray(value)) {
            setFilters(prev => ({
                ...prev,
                [filterName]: value as [number, number]
            }));
        }
    };

    const handleDateChange = (filterName: "dateRange" | "estimatedFarrowingDateRange", index: 0 | 1, value: string) => {
        const newRange: [Date | null, Date | null] = [...filters[filterName]] as [Date | null, Date | null];
        newRange[index] = value ? new Date(value) : null;
        setFilters(prev => ({
            ...prev,
            [filterName]: newRange
        }));
    };

    const applyFilters = () => {
        let result = [...inseminations];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(ins =>
                ins.sow?.code?.toLowerCase().includes(term) ||
                (ins.responsible && `${ins.responsible.name} ${ins.responsible.lastname}`.toLowerCase().includes(term))
            );
        }

        // Doses
        if (filters.dosesRange) {
            result = result.filter(ins =>
                ins.doses.length >= filters.dosesRange[0] &&
                ins.doses.length <= filters.dosesRange[1]
            );
        }

        // Fecha de inseminación
        if (filters.dateRange[0]) {
            result = result.filter(ins => new Date(ins.date) >= filters.dateRange[0]!);
        }
        if (filters.dateRange[1]) {
            result = result.filter(ins => new Date(ins.date) <= filters.dateRange[1]!);
        }

        // Estado
        if (filters.status) {
            result = result.filter(ins => ins.status === filters.status);
        }

        // Resultado
        if (filters.result !== "") {
            result = result.filter(ins => ins.result === filters.result);
        }

        // Fecha prevista de parto
        if (filters.estimatedFarrowingDateRange[0]) {
            result = result.filter(ins => ins.estimated_farrowing_date && new Date(ins.estimated_farrowing_date) >= filters.estimatedFarrowingDateRange[0]!);
        }
        if (filters.estimatedFarrowingDateRange[1]) {
            result = result.filter(ins => ins.estimated_farrowing_date && new Date(ins.estimated_farrowing_date) <= filters.estimatedFarrowingDateRange[1]!);
        }

        setFilteredInseminations(result);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setFilters({
            dosesRange: [0, 10],
            dateRange: [null, null],
            status: "",
            result: "",
            estimatedFarrowingDateRange: [null, null]
        });
        setPopoverOpen(false);
        setFilteredInseminations([...inseminations]);
    };

    const activeFilterCount = Object.values(filters).filter(v =>
        v !== "" && !(Array.isArray(v) && v[0] === 0 && v[1] === 10) && !(Array.isArray(v) && v[0] === null && v[1] === null)
    ).length;

    return (
        <div className="d-flex gap-3 mb-3 flex-wrap">
            <div className="position-relative">
                <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control ps-5"
                    onBlur={applyFilters}
                    style={{width: '400px'}}
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
                style={{ minWidth: "450px" }}
            >
                <PopoverHeader className="d-flex justify-content-between align-items-center">
                    <span className="text-black">Filtros de inseminaciones</span>
                    <Button close onClick={togglePopover} />
                </PopoverHeader>
                <PopoverBody>
                    <Row className="">
                        <FormGroup>
                            <Label>Dosis administradas: {filters.dosesRange[0]} - {filters.dosesRange[1]}</Label>
                            <Slider
                                range
                                min={0}
                                max={10}
                                value={filters.dosesRange}
                                onChange={(val) => handleRangeChange("dosesRange", val)}
                                onAfterChange={applyFilters}
                                trackStyle={[{ backgroundColor: '#405189' }]}
                                handleStyle={[{ backgroundColor: '#405189', borderColor: '#405189' }, { backgroundColor: '#405189', borderColor: '#405189' }]}
                            />
                        </FormGroup>

                        <div className="d-flex gap-2">
                            <FormGroup className="w-50">
                                <Label>Estado</Label>
                                <Select
                                    options={statusOptions}
                                    value={statusOptions.find(opt => opt.value === filters.status)}
                                    onChange={(opt: any) => { handleFilterChange("status", opt?.value || ""); applyFilters(); }}
                                />
                            </FormGroup>

                            <FormGroup className="w-50">
                                <Label>Resultado</Label>
                                <Select
                                    options={resultOptions}
                                    value={resultOptions.find(opt => opt.value === filters.result)}
                                    onChange={(opt: any) => { handleFilterChange("result", opt?.value); applyFilters(); }}
                                />
                            </FormGroup>
                        </div>

                        <Col md={6}>
                            <FormGroup>
                                <Label>Fecha de inseminación desde</Label>
                                <Input type="date" value={filters.dateRange[0] ? filters.dateRange[0].toISOString().split('T')[0] : ""} onChange={e => { handleDateChange("dateRange", 0, e.target.value); applyFilters(); }} />
                            </FormGroup>
                            <FormGroup>
                                <Label>Fecha de inseminación hasta</Label>
                                <Input type="date" value={filters.dateRange[1] ? filters.dateRange[1].toISOString().split('T')[0] : ""} onChange={e => { handleDateChange("dateRange", 1, e.target.value); applyFilters(); }} />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Parto previsto desde</Label>
                                <Input type="date" value={filters.estimatedFarrowingDateRange[0] ? filters.estimatedFarrowingDateRange[0].toISOString().split('T')[0] : ""} onChange={e => { handleDateChange("estimatedFarrowingDateRange", 0, e.target.value); applyFilters(); }} />
                            </FormGroup>
                            <FormGroup>
                                <Label>Parto previsto hasta</Label>
                                <Input type="date" value={filters.estimatedFarrowingDateRange[1] ? filters.estimatedFarrowingDateRange[1].toISOString().split('T')[0] : ""} onChange={e => { handleDateChange("estimatedFarrowingDateRange", 1, e.target.value); applyFilters(); }} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-between mt-3">
                        <Button color="link" onClick={clearFilters} className="text-danger"><FiX className="me-1" /> Limpiar todo</Button>
                        <Button color="primary" onClick={() => { applyFilters(); togglePopover(); }}>Aplicar filtros</Button>
                    </div>
                </PopoverBody>
            </Popover>
        </div>
    )
};

export default InseminationFilters;