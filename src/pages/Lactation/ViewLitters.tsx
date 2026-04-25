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

const ViewLitters = () => {
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
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Fecha de nacimiento', accessor: 'birthDate', type: 'date', isFilterable: true },
        {
            header: 'Madre',
            accessor: 'mother',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/pigs/pig_details/${row.mother._id}`)
                    }}
                >
                    {row.mother.code} ↗
                </Button>
            )
        },
        { 
            header: 'Machos', 
            accessor: 'currentMale', 
            type: 'text', 
            isFilterable: true,
            bgColor: "#e3f2fd"
        },
        { 
            header: 'Hembras', 
            accessor: 'currentFemale', 
            type: 'text', 
            isFilterable: true,
            bgColor: "#fce4ec"
        },
        { 
            header: 'Peso promedio', 
            accessor: 'averageWeight', 
            type: 'text', 
            isFilterable: true,
            bgColor: "#e8f5e9"
        },
        {
            header: 'Peso total',
            accessor: 'averageWeight',
            type: 'text',
            isFilterable: true,
            bgColor: "#fff3e0",
            render: (_, row) => <span>{(row.averageWeight * (row.currentMale + row.currentFemale)).toFixed(2)}</span>
        },
        {
            header: 'Estado',
            accessor: 'status',
            type: 'text',
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "active":
                        color = "primary";
                        label = "Lactando";
                        break;
                    case "ready_to_wean":
                        color = "warning";
                        label = "Listo para destetar";
                        break;
                    case "weaned":
                        color = "success";
                        label = "Destetada";
                        break;
                    case "wean_overdue":
                        color = "black";
                        label = "Destete vencido";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Acciones",
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
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF, intentelo más tarde' });
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
            console.error('Error fetching data: ', error)
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
                <BreadCrumb title={"Camadas"} pageTitle={"Lactancia"} />

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center gap-2">
                        <div className="d-flex align-items-center gap-3">
                            <h4 className="mb-0">Camadas</h4>
                            {selectedLitters.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedLitters.length} {selectedLitters.length === 1 ? 'camada seleccionada' : 'camadas seleccionadas'}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-primary-button btn-sm"
                                            disabled={!hasActiveLitters}
                                            title={!hasActiveLitters ? "No hay camadas activas para asignar medicación" : undefined}
                                            onClick={() => setBulkMedicationModalOpen(true)}
                                        >
                                            <i className="ri-medicine-bottle-line me-1"></i>
                                            Asignar Medicación
                                        </Button>
                                        <Button
                                            color="info"
                                            className="btn-sm"
                                            disabled={!hasActiveLitters}
                                            title={!hasActiveLitters ? "No hay camadas activas para administrar alimento" : undefined}
                                            onClick={() => setBulkFeedAdminModalOpen(true)}
                                        >
                                            <i className="ri-restaurant-line me-1"></i>
                                            Administrar alimento
                                        </Button>
                                        <Button
                                            color="warning"
                                            className="btn-sm"
                                            disabled={!hasReadyToWeanLitters}
                                            title={!hasReadyToWeanLitters ? "No hay camadas listas para destetar" : undefined}
                                            onClick={() => setBulkWeanModalOpen(true)}
                                        >
                                            <i className="ri-scissors-cut-line me-1"></i>
                                            Destetar Camadas
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button color="primary" className="ms-auto" onClick={() => setDateRangeModalOpen(true)} disabled={pdfLoading}>
                            {pdfLoading ? (
                                <><Spinner className="me-2" size="sm" />Generando...</>
                            ) : (
                                <><i className="ri-file-pdf-line me-2" />Exportar PDF</>
                            )}
                        </Button>
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
                                    <div>No hay camadas registradas</div>
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
                <ModalHeader toggle={() => setDateRangeModalOpen(false)}>Seleccionar rango de fechas de nacimiento</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => setDateRangeModalOpen(false)}
                    loading={pdfLoading}
                    generateButtonText="Generar PDF"
                />
            </Modal>

            <Modal size="xl" isOpen={pdfModalOpen} toggle={() => setPdfModalOpen(false)} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => setPdfModalOpen(false)}>Reporte de Camadas</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewLitters;