import { useState } from "react";
import { Button, Label, FormGroup, ModalBody, ModalFooter, Spinner } from "reactstrap";
import DatePicker from "react-flatpickr";

interface ReportDateRangeSelectorProps {
    onGenerate: (startDate: string, endDate: string) => void;
    onCancel: () => void;
    loading?: boolean;
    generateButtonText?: string;
}

const ReportDateRangeSelector: React.FC<ReportDateRangeSelectorProps> = ({ 
    onGenerate, 
    onCancel, 
    loading = false,
    generateButtonText = "Generar PDF"
}) => {
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    const getDateRange = (preset: string) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (preset) {
            case 'today':
                return {
                    start: today.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return {
                    start: weekStart.toISOString().split('T')[0],
                    end: weekEnd.toISOString().split('T')[0]
                };
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return {
                    start: monthStart.toISOString().split('T')[0],
                    end: monthEnd.toISOString().split('T')[0]
                };
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                const yearEnd = new Date(now.getFullYear(), 11, 31);
                return {
                    start: yearStart.toISOString().split('T')[0],
                    end: yearEnd.toISOString().split('T')[0]
                };
            default:
                return { start: '', end: '' };
        }
    };

    const handleGenerate = () => {
        let startDate = '';
        let endDate = '';

        if (selectedPreset) {
            const range = getDateRange(selectedPreset);
            startDate = range.start;
            endDate = range.end;
        } else if (customStartDate && customEndDate) {
            startDate = customStartDate;
            endDate = customEndDate;
        }

        if (startDate && endDate) {
            onGenerate(startDate, endDate);
        }
    };

    const isValid = selectedPreset || (customStartDate && customEndDate);

    return (
        <>
            <ModalBody>
                <div className="mb-4">
                    <Label className="form-label fw-bold">Períodos rápidos</Label>
                    <div className="d-grid gap-2">
                        <Button
                            color={selectedPreset === 'today' ? 'primary' : 'light'}
                            onClick={() => {
                                setSelectedPreset('today');
                                setCustomStartDate('');
                                setCustomEndDate('');
                            }}
                            className="text-start d-flex align-items-center border"
                        >
                            <i className={`ri-calendar-line me-2 fs-5 ${selectedPreset === 'today' ? 'text-white' : 'text-primary'}`}></i>
                            <span className={selectedPreset === 'today' ? 'text-white' : 'text-dark'}>Hoy</span>
                        </Button>
                        <Button
                            color={selectedPreset === 'week' ? 'primary' : 'light'}
                            onClick={() => {
                                setSelectedPreset('week');
                                setCustomStartDate('');
                                setCustomEndDate('');
                            }}
                            className="text-start d-flex align-items-center border"
                        >
                            <i className={`ri-calendar-2-line me-2 fs-5 ${selectedPreset === 'week' ? 'text-white' : 'text-primary'}`}></i>
                            <span className={selectedPreset === 'week' ? 'text-white' : 'text-dark'}>Esta semana</span>
                        </Button>
                        <Button
                            color={selectedPreset === 'month' ? 'primary' : 'light'}
                            onClick={() => {
                                setSelectedPreset('month');
                                setCustomStartDate('');
                                setCustomEndDate('');
                            }}
                            className="text-start d-flex align-items-center border"
                        >
                            <i className={`ri-calendar-check-line me-2 fs-5 ${selectedPreset === 'month' ? 'text-white' : 'text-primary'}`}></i>
                            <span className={selectedPreset === 'month' ? 'text-white' : 'text-dark'}>Este mes</span>
                        </Button>
                        <Button
                            color={selectedPreset === 'year' ? 'primary' : 'light'}
                            onClick={() => {
                                setSelectedPreset('year');
                                setCustomStartDate('');
                                setCustomEndDate('');
                            }}
                            className="text-start d-flex align-items-center border"
                        >
                            <i className={`ri-calendar-event-line me-2 fs-5 ${selectedPreset === 'year' ? 'text-white' : 'text-primary'}`}></i>
                            <span className={selectedPreset === 'year' ? 'text-white' : 'text-dark'}>Este año</span>
                        </Button>
                    </div>
                </div>

                <div className="mb-4">
                    <Label className="form-label fw-bold">Rango personalizado</Label>
                    <div className="row g-3">
                        <div className="col-6">
                            <Label for="startDate">Fecha inicio</Label>
                            <DatePicker
                                id="startDate"
                                className="form-control w-100"
                                value={customStartDate}
                                onChange={(dates) => {
                                    if (dates.length > 0) {
                                        setCustomStartDate(dates[0].toISOString().split('T')[0]);
                                        setSelectedPreset('');
                                    }
                                }}
                                options={{
                                    dateFormat: "Y-m-d",
                                    locale: {
                                        firstDayOfWeek: 0,
                                        weekdays: {
                                            shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                                            longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                                        },
                                        months: {
                                            shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                                            longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                                        },
                                    },
                                }}
                            />
                        </div>
                        <div className="col-6">
                            <Label for="endDate">Fecha fin</Label>
                            <DatePicker
                                id="endDate"
                                className="form-control w-100"
                                value={customEndDate}
                                onChange={(dates) => {
                                    if (dates.length > 0) {
                                        setCustomEndDate(dates[0].toISOString().split('T')[0]);
                                        setSelectedPreset('');
                                    }
                                }}
                                options={{
                                    dateFormat: "Y-m-d",
                                    locale: {
                                        firstDayOfWeek: 0,
                                        weekdays: {
                                            shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                                            longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                                        },
                                        months: {
                                            shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                                            longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button 
                    color="primary" 
                    onClick={handleGenerate}
                    disabled={loading || !isValid}
                >
                    {loading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            Generando...
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            {generateButtonText}
                        </>
                    )}
                </Button>
            </ModalFooter>
        </>
    );
};

export default ReportDateRangeSelector;
