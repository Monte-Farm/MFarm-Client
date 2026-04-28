import { useState } from "react";
import { useTranslation } from "react-i18next";
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
    generateButtonText,
}) => {
    const { t } = useTranslation();
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    const buttonText = generateButtonText ?? t("shared.dateRangeSelector.generatePdf");

    type Week7 = [string, string, string, string, string, string, string];
    type Month12 = [string, string, string, string, string, string, string, string, string, string, string, string];
    const calendarLocale = {
        firstDayOfWeek: 0 as const,
        weekdays: {
            shorthand: t("shared.dateRangeSelector.calendar.weekdaysShort", { returnObjects: true }) as Week7,
            longhand: t("shared.dateRangeSelector.calendar.weekdaysLong", { returnObjects: true }) as Week7,
        },
        months: {
            shorthand: t("shared.dateRangeSelector.calendar.monthsShort", { returnObjects: true }) as Month12,
            longhand: t("shared.dateRangeSelector.calendar.monthsLong", { returnObjects: true }) as Month12,
        },
    };

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
                    <Label className="form-label fw-bold">{t("shared.dateRangeSelector.quickPeriods")}</Label>
                    <div className="d-grid gap-2">
                        {(['today', 'week', 'month', 'year'] as const).map((preset) => (
                            <Button
                                key={preset}
                                color={selectedPreset === preset ? 'primary' : 'light'}
                                onClick={() => {
                                    setSelectedPreset(preset);
                                    setCustomStartDate('');
                                    setCustomEndDate('');
                                }}
                                className="text-start d-flex align-items-center border"
                            >
                                <i className={`ri-calendar${preset === 'today' ? '-line' : preset === 'week' ? '-2-line' : preset === 'month' ? '-check-line' : '-event-line'} me-2 fs-5 ${selectedPreset === preset ? 'text-white' : 'text-primary'}`}></i>
                                <span className={selectedPreset === preset ? 'text-white' : ''}>
                                    {t(`shared.dateRangeSelector.${preset}`)}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <Label className="form-label fw-bold">{t("shared.dateRangeSelector.customRange")}</Label>
                    <div className="row g-3">
                        <div className="col-6">
                            <Label for="startDate">{t("shared.dateRangeSelector.startDate")}</Label>
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
                                    locale: calendarLocale,
                                }}
                            />
                        </div>
                        <div className="col-6">
                            <Label for="endDate">{t("shared.dateRangeSelector.endDate")}</Label>
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
                                    locale: calendarLocale,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onCancel}>
                    {t("common.button.cancel")}
                </Button>
                <Button
                    color="primary"
                    onClick={handleGenerate}
                    disabled={loading || !isValid}
                >
                    {loading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            {t("shared.dateRangeSelector.generating")}
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            {buttonText}
                        </>
                    )}
                </Button>
            </ModalFooter>
        </>
    );
};

export default ReportDateRangeSelector;
