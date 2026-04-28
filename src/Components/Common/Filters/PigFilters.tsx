import { useRef } from "react";
import { FiFilter, FiSearch, FiX } from "react-icons/fi";
import Select from "react-select";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import {
    Button, Input, Popover, PopoverHeader,
    PopoverBody, Row, Col, FormGroup, Label, Badge
} from "reactstrap";
import { useTranslation } from "react-i18next";

export interface PigFiltersState {
    status: string;
    currentStage: string;
    origin: string;
    sex: string;
    breed: string;
    weightRange: [number, number];
}

interface PigFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filters: PigFiltersState;
    onFilterChange: (filterName: string, value: any) => void;
    onWeightRangeChange: (value: number | number[]) => void;
    onClearFilters: () => void;
    popoverOpen: boolean;
    onTogglePopover: () => void;
    predefinedBreeds?: string[];
}

const PigFilters: React.FC<PigFiltersProps> = ({
    searchTerm,
    onSearchChange,
    filters,
    onFilterChange,
    onWeightRangeChange,
    onClearFilters,
    popoverOpen,
    onTogglePopover,
    predefinedBreeds = [
        "Yorkshire",
        "Landrace",
        "Duroc",
        "Hampshire",
        "Pietrain",
        "Berkshire",
        "Large White",
        "Chester White",
        "Poland China",
        "Tamworth"
    ]
}) => {
    const { t } = useTranslation();
    const filterBtnRef = useRef(null);

    const activeFilterCount = Object.values(filters).filter(v =>
        v !== "" && !(Array.isArray(v) && v[0] === 0 && v[1] === 500)
    ).length;

    const statusOptions = [
        { value: "", label: t('pigs.filter.allStatus') },
        { value: "alive", label: t('pigs.status.alive') },
        { value: "sold", label: t('pigs.status.sold') },
        { value: "slaughtered", label: t('pigs.status.slaughtered') },
        { value: "dead", label: t('pigs.status.dead') },
        { value: "discarded", label: t('pigs.status.discarded') },
    ];

    const stageOptions = [
        { value: "", label: t('pigs.filter.allStages') },
        { value: "piglet", label: t('pigs.stage.piglet') },
        { value: "weaning", label: t('pigs.stage.weaning') },
        { value: "fattening", label: t('pigs.stage.fattening') },
        { value: "breeder", label: t('pigs.stage.breeder') },
        { value: "gestation", label: t('pigs.stage.gestation') },
    ];

    const originOptions = [
        { value: "", label: t('pigs.filter.allOrigins') },
        { value: "born", label: t('pigs.origin.born') },
        { value: "purchased", label: t('pigs.origin.purchased') },
        { value: "donated", label: t('pigs.origin.donated') },
        { value: "other", label: t('pigs.origin.other') },
    ];

    const sexOptions = [
        { value: "", label: t('pigs.filter.allSex') },
        { value: "male", label: t('pigs.sex.maleShort') },
        { value: "female", label: t('pigs.sex.femaleShort') },
    ];

    const breedOptions = [
        { value: "", label: t('pigs.filter.allBreeds') },
        ...predefinedBreeds.map(breed => ({ value: breed, label: breed }))
    ];

    return (
        <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="position-relative flex-grow-1" style={{ maxWidth: "400px" }}>
                <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Input
                    type="text"
                    placeholder={t('pigs.filter.search')}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="form-control ps-5"
                />
            </div>

            <Button innerRef={filterBtnRef} color="light" onClick={onTogglePopover} className="d-flex align-items-center position-relative">
                <FiFilter className="me-2" />
                {t('pigs.filter.title')}
                {activeFilterCount > 0 && (
                    <Badge color="primary" pill className="position-absolute top-0 start-100 translate-middle">
                        {activeFilterCount}
                    </Badge>
                )}
            </Button>

            <Popover placement="bottom-end" isOpen={popoverOpen} target={filterBtnRef} toggle={onTogglePopover} trigger="legacy" className="filter-popover" style={{ minWidth: "450px" }}>
                <PopoverHeader className="d-flex justify-content-between align-items-center popover-header">
                    <span className="text-black">{t('pigs.filter.header')}</span>
                    <Button close onClick={onTogglePopover} />
                </PopoverHeader>
                <PopoverBody className="popover-body">
                    <Row className="g-3">
                        <Col md={6}>
                            <FormGroup>
                                <Label>{t('pigs.filter.status')}</Label>
                                <Select
                                    options={statusOptions}
                                    value={statusOptions.find(opt => opt.value === filters.status)}
                                    onChange={(opt: any) => onFilterChange("status", opt?.value || "")}
                                    className="react-select"
                                    classNamePrefix="select"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>{t('pigs.filter.stage')}</Label>
                                <Select
                                    options={stageOptions}
                                    value={stageOptions.find(opt => opt.value === filters.currentStage)}
                                    onChange={(opt: any) => onFilterChange("currentStage", opt?.value || "")}
                                    className="react-select"
                                    classNamePrefix="select"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>{t('pigs.filter.origin')}</Label>
                                <Select
                                    options={originOptions}
                                    value={originOptions.find(opt => opt.value === filters.origin)}
                                    onChange={(opt: any) => onFilterChange("origin", opt?.value || "")}
                                    className="react-select"
                                    classNamePrefix="select"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>{t('pigs.filter.sex')}</Label>
                                <Select
                                    options={sexOptions}
                                    value={sexOptions.find(opt => opt.value === filters.sex)}
                                    onChange={(opt: any) => onFilterChange("sex", opt?.value || "")}
                                    className="react-select"
                                    classNamePrefix="select"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>{t('pigs.filter.breed')}</Label>
                                <Select
                                    options={breedOptions}
                                    value={breedOptions.find(opt => opt.value === filters.breed)}
                                    onChange={(opt: any) => onFilterChange("breed", opt?.value || "")}
                                    className="react-select"
                                    classNamePrefix="select"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>
                                    {t('pigs.filter.weightRange', { min: filters.weightRange[0], max: filters.weightRange[1] })}
                                </Label>
                                <Slider
                                    range
                                    min={0}
                                    max={500}
                                    value={filters.weightRange}
                                    onChange={onWeightRangeChange}
                                    trackStyle={[{ backgroundColor: '#405189' }]}
                                    handleStyle={[
                                        { borderColor: '#405189', backgroundColor: '#fff' },
                                        { borderColor: '#405189', backgroundColor: '#fff' }
                                    ]}
                                    railStyle={{ backgroundColor: '#e9ecef' }}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button color="light" onClick={onClearFilters} className="d-flex align-items-center">
                            <FiX className="me-1" />
                            {t('pigs.filter.clear')}
                        </Button>
                    </div>
                </PopoverBody>
            </Popover>
        </div>
    );
};

export default PigFilters;
