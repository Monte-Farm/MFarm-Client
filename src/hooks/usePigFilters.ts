import { useState, useEffect } from 'react';
import { PigData } from 'common/data_interfaces';
import { PigFiltersState } from 'Components/Common/Filters/PigFilters';

export const usePigFilters = (pigs: PigData[]) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<PigFiltersState>({
        status: "",
        currentStage: "",
        origin: "",
        sex: "",
        breed: "",
        weightRange: [0, 500]
    });
    const [filteredPigs, setFilteredPigs] = useState<PigData[]>([]);
    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, filters, pigs]);

    const applyFilters = () => {
        let result = [...pigs];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(pig =>
                pig.code.toLowerCase().includes(term) ||
                pig.breed.toLowerCase().includes(term) ||
                (pig.observations && pig.observations.toLowerCase().includes(term))
            );
        }

        if (filters.status) {
            result = result.filter(pig => pig.status === filters.status);
        }
        if (filters.currentStage) {
            result = result.filter(pig => pig.currentStage === filters.currentStage);
        }
        if (filters.origin) {
            result = result.filter(pig => pig.origin === filters.origin);
        }
        if (filters.sex) {
            result = result.filter(pig => pig.sex === filters.sex);
        }
        if (filters.breed) {
            result = result.filter(pig => pig.breed === filters.breed);
        }
        if (filters.weightRange) {
            result = result.filter(pig =>
                Number(pig.weight) >= filters.weightRange[0] &&
                Number(pig.weight) <= filters.weightRange[1]
            );
        }

        setFilteredPigs(result);
    };

    const handleFilterChange = (filterName: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const handleWeightRangeChange = (value: number | number[]) => {
        if (Array.isArray(value)) {
            setFilters(prev => ({
                ...prev,
                weightRange: value as [number, number]
            }));
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setFilters({
            status: "",
            currentStage: "",
            origin: "",
            sex: "",
            breed: "",
            weightRange: [0, 500]
        });
        setPopoverOpen(false);
    };

    const togglePopover = () => setPopoverOpen(!popoverOpen);

    return {
        searchTerm,
        setSearchTerm,
        filters,
        filteredPigs,
        popoverOpen,
        handleFilterChange,
        handleWeightRangeChange,
        clearFilters,
        togglePopover
    };
};
