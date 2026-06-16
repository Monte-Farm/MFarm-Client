import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { config } from "process";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import BulkMedicationAssignmentModal from "Components/Common/Forms/BulkMedicationAssignmentModal";
import BulkWeanLittersModal from "Components/Common/Forms/BulkWeanLittersModal";
import BulkFeedAdministrationModal from "Components/Common/Forms/BulkFeedAdministrationModal";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import CreateLitterStandaloneForm from "Components/Common/Forms/CreateLitterStandaloneForm";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
    active: 'primary', ready_to_wean: 'warning', weaned: 'success', wean_overdue: 'black',
};

const ViewLitters = () => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true)
    const [litters, setLitters] = useState<any[]>([])
    const [selectedLitters, setSelectedLitters] = useState<any[]>([])
    const [bulkMedicationModalOpen, setBulkMedicationModalOpen] = useState(false);
    const [bulkFeedAdminModalOpen, setBulkFeedAdminModalOpen] = useState(false);
    const [bulkWeanModalOpen, setBulkWeanModalOpen] = useState(false);
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const handleSelectionChange = (selected: any[]) => {
        setSelectedLitters(selected);
    };

    const hasActiveLitters = selectedLitters.some(litter => litter.status === 'active');
    const hasReadyToWeanLitters = selectedLitters.some(litter => litter.status === 'ready_to_wean' || litter.status === 'wean_overdue');

    const handleBulkMedicationSuccess = () => {
        fetchLitter();
        setSelectedLitters([]);
    };

    const handleBulkWeanSuccess = () => {
        fetchLitter();
        setSelectedLitters([]);
    };

    const litterColumns: Column<any>[] = [
        { header: t('litter.column.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('litter.column.birthDate'), accessor: 'birthDate', type: 'date', isFilterable: true },
        {
            header: t('litter.column.mother'),
            accessor: 'mother',
            type: 'text',
            isFilterable: true,
            bgColor: '#E8F5E9',
            render: (_, row) => row.mother ? (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/pigs/pig_details/${row.mother._id}`)
                    }}
                >
                    {row.mother.earTag || row.mother.code} ↗
                </Button>
            ) : <span className="text-muted">—</span>
        },
        {
            header: t('litter.column.males'),
            accessor: 'currentMale',
            type: 'text',
            isFilterable: true,
            bgColor: "#e3f2fd"
        },
        {
            header: t('litter.column.females'),
            accessor: 'currentFemale',
            type: 'text',
            isFilterable: true,
            bgColor: "#fce4ec"
        },
        {
            header: t('litter.column.total'),
            accessor: 'currentMale',
            type: 'text',
            isFilterable: false,
            bgColor: "#f3e5f5",
            render: (_, row) => <span>{row.currentMale + row.currentFemale}</span>
        },
        {
            header: t('litter.column.avgWeight'),
            accessor: 'averageWeight',
            type: 'text',
            isFilterable: true,
            bgColor: "#e8f5e9"
        },
        {
            header: t('litter.column.totalWeight'),
            accessor: 'averageWeight',
            type: 'text',
            isFilterable: true,
            bgColor: "#fff3e0",
            render: (_, row) => <span>{(row.averageWeight * (row.currentMale + row.currentFemale)).toFixed(2)}</span>
        },
        {
            header: t('litter.column.status'),
            accessor: 'status',
            type: 'text',
            isFilterable: true,
            render: (value: string) => {
                const color = STATUS_COLORS[value] || 'secondary';
                const label = t(`litter.status.${value}`, { defaultValue: value });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('litter.column.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/lactation/litter_details/${row._id}`); }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            setDateRangeModalOpen(false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/litters/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            setPdfModalOpen(true);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('litter.error.pdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchLitter = async () => {
        if (!configContext || !userLogged) return
        try {
            setLoading(true)
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/found_by_farm/${userLogged.farm_assigned}`)
            const littersWithId = litterResponse.data.data.map((litter: any) => ({ ...litter, id: litter._id }));
            setLitters(littersWithId)
        } catch (error) {
            logger.error('Error fetching data: ', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLitter()
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('litter.breadcrumb.title')} pageTitle={t('litter.breadcrumb.parent')} />

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center gap-2">
                        <div className="d-flex align-items-center gap-3">
                            <h4 className="mb-0">{t('litter.breadcrumb.title')}</h4>
                            {selectedLitters.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedLitters.length} {selectedLitters.length === 1 ? t('litter.selected.singular') : t('litter.selected.plural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-primary-button btn-sm"
                                            disabled={!hasActiveLitters}
                                            title={!hasActiveLitters ? t('litter.tooltip.noActiveMedication') : undefined}
                                            onClick={() => setBulkMedicationModalOpen(true)}
                                        >
                                            <i className="ri-medicine-bottle-line me-1"></i>
                                            {t('litter.action.assignMedication')}
                                        </Button>
                                        <Button
                                            color="info"
                                            className="btn-sm"
                                            disabled={!hasActiveLitters}
                                            title={!hasActiveLitters ? t('litter.tooltip.noActiveFeed') : undefined}
                                            onClick={() => setBulkFeedAdminModalOpen(true)}
                                        >
                                            <i className="ri-restaurant-line me-1"></i>
                                            {t('litter.action.adminFeed')}
                                        </Button>
                                        <Button
                                            color="warning"
                                            className="btn-sm"
                                            disabled={!hasReadyToWeanLitters}
                                            title={!hasReadyToWeanLitters ? t('litter.tooltip.noReadyToWean') : undefined}
                                            onClick={() => setBulkWeanModalOpen(true)}
                                        >
                                            <i className="ri-scissors-cut-line me-1"></i>
                                            {t('litter.action.weanLitters')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="d-flex gap-2 ms-auto">
                        <Button color="success" onClick={() => setCreateModalOpen(true)}>
                            <i className="ri-add-line me-1" />
                            {t('litter.standalone.action.register')}
                        </Button>
                        <Button color="primary" onClick={() => setDateRangeModalOpen(true)} disabled={pdfLoading}>
                            {pdfLoading ? (
                                <><Spinner className="me-2" size="sm" />{t('litter.action.generating')}</>
                            ) : (
                                <><i className="ri-file-pdf-line me-2" />{t('litter.action.exportPdf')}</>
                            )}
                        </Button>
                        </div>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {litters && litters.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <SelectableCustomTable
                                    columns={litterColumns}
                                    data={litters}
                                    showPagination={true}
                                    rowsPerPage={7}
                                    onSelect={handleSelectionChange}
                                    selectionOnlyOnCheckbox={true}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>{t('litter.empty.noLitters')}</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <BulkMedicationAssignmentModal
                isOpen={bulkMedicationModalOpen}
                onClose={() => setBulkMedicationModalOpen(false)}
                selectedLitters={selectedLitters}
                onSuccess={handleBulkMedicationSuccess}
            />

            <BulkFeedAdministrationModal
                isOpen={bulkFeedAdminModalOpen}
                onClose={() => setBulkFeedAdminModalOpen(false)}
                targetType="litter"
                selectedTargets={selectedLitters}
                onSuccess={() => { fetchLitter(); setSelectedLitters([]); }}
            />

            <BulkWeanLittersModal
                isOpen={bulkWeanModalOpen}
                onClose={() => setBulkWeanModalOpen(false)}
                selectedLitters={selectedLitters}
                onSuccess={handleBulkWeanSuccess}
            />

            <Modal size="md" isOpen={dateRangeModalOpen} toggle={() => setDateRangeModalOpen(false)} centered>
                <ModalHeader toggle={() => setDateRangeModalOpen(false)}>{t('litter.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => setDateRangeModalOpen(false)}
                    loading={pdfLoading}
                    generateButtonText={t('litter.modal.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={pdfModalOpen} toggle={() => setPdfModalOpen(false)} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => setPdfModalOpen(false)}>{t('litter.modal.report')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={createModalOpen} toggle={() => setCreateModalOpen(false)} centered backdrop="static" keyboard={false}>
                <ModalHeader toggle={() => setCreateModalOpen(false)}>{t('litter.standalone.modal.title')}</ModalHeader>
                <ModalBody>
                    <CreateLitterStandaloneForm
                        onSave={() => { fetchLitter(); setCreateModalOpen(false); }}
                        onCancel={() => setCreateModalOpen(false)}
                    />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewLitters;
