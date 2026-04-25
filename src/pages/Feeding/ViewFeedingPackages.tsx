import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import FeedingPackageDetails from "Components/Common/Details/FeedingPackageDetails";
import FeedingPackageForm from "Components/Common/Forms/FeedingPackageForm";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEEDING_PACKAGE_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import AlertMessage from "Components/Common/Shared/AlertMesagge";

const ViewFeedingPackages = () => {
    document.title = 'Ver recetas de alimentación | System Management'
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [feedingPackages, setFeedingPackages] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [modals, setModals] = useState({ create: false, details: false, update: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [selectedFeedingPackage, setSelectedFeedingPackage] = useState<any>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const feedingPackagesColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        { header: 'Fecha de creacion', accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: 'Responsable de creacion',
            accessor: 'creation_responsible',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (<span>{row.creation_responsible.name} {row.creation_responsible.lastname}</span>)
        },
        {
            header: 'Etapa',
            accessor: 'stage',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.stage) {
                    case "general":
                        color = "info";
                        text = "General";
                        break;
                    case "piglet":
                        color = "info";
                        text = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        text = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        text = "Engorda";
                        break;
                    case "breeder":
                        color = "success";
                        text = "Reproductor";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: 'Estado', accessor: 'is_active', isFilterable: true, render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{value ? "Activo" : "Inactivo"}</Badge>
            ),
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (_value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" title="Ver detalles" onClick={() => { setSelectedFeedingPackage(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <Button color="warning" className="btn-icon" title="Editar receta" onClick={() => { setSelectedFeedingPackage(row); toggleModal('update') }}>
                        <i className="ri-pencil-line align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/feeding_packages/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF, intentelo más tarde' });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const feedingResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.findByFarm(userLogged.farm_assigned)}`);
            setFeedingPackages(feedingResponse.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver recetas de alimentación"} pageTitle={"Alimentación"} />

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex gap-2 justify-content-end">
                            <Button color="primary" onClick={() => toggleModal('dateRange')} disabled={pdfLoading}>
                                {pdfLoading ? (
                                    <><Spinner className="me-2" size="sm" />Generando...</>
                                ) : (
                                    <><i className="ri-file-pdf-line me-2" />Exportar PDF</>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                Crear receta de alimentación
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={feedingPackages.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {feedingPackages.length === 0 ? (
                            <>
                                <FiInbox className="text-muted" size={48} style={{ marginBottom: 10 }} />
                                <span className="fs-5 text-muted">Aún no hay recetas registradas</span>
                            </>
                        ) : (
                            <CustomTable columns={feedingPackagesColumns} data={feedingPackages} showPagination={true} rowsPerPage={10} />
                        )}
                    </CardBody>
                </Card>
            </Container>


            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva receta de alimentación</ModalHeader>
                <ModalBody>
                    <FeedingPackageForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => toggleModal('create', false)} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>Editar receta de alimentación</ModalHeader>
                <ModalBody>
                    {selectedFeedingPackage?._id && (
                        <FeedingPackageForm
                            feedingPackageId={selectedFeedingPackage._id}
                            onSave={() => { toggleModal('update'); fetchData(); }}
                            onCancel={() => toggleModal('update', false)}
                        />
                    )}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => { toggleModal("details"); fetchData() }}>Detalles de la receta</ModalHeader>
                <ModalBody>
                    <FeedingPackageDetails feedingPackageId={selectedFeedingPackage?._id} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>Seleccionar rango de fechas de creación</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText="Generar PDF"
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Recetas de Alimentación</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewFeedingPackages;