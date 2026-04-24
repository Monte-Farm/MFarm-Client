import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import FeedPreparationDetails from "Components/Common/Details/FeedPreparationDetails";
import FeedPreparationForm from "Components/Common/Forms/FeedPreparationForm";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import { FEED_PREPARATION_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";

const ViewFeedPreparations = () => {
    document.title = 'Preparaciones de alimento | System Management';
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [preparations, setPreparations] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ create: false, details: false });
    const [selectedPreparation, setSelectedPreparation] = useState<any>(null);

    const toggleModal = (m: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [m]: state ?? !prev[m] }));
    };

    const columns: Column<any>[] = [
        { header: 'Código', accessor: 'code', type: 'text', isFilterable: true },
        {
            header: 'Receta', accessor: 'recipe.name',
            isFilterable: true,
            render: (_, row) => (<span>{row.recipe?.code} — {row.recipe?.name}</span>)
        },
        { header: 'Fecha', accessor: 'preparationDate', type: 'date', isFilterable: true },
        {
            header: 'Mezcla preparada (kg)', accessor: 'batchSize',
            type: 'number',
            bgColor: '#e3f2fd',
            render: (_, row) => <span className="fw-medium">{(row.batchSize ?? 0).toFixed(2)}</span>
        },
        {
            header: 'Producido (kg)', accessor: 'actualYield',
            type: 'number',
            bgColor: '#e8f5e9',
            render: (_, row) => <span className="fw-medium">{(row.actualYield ?? 0).toFixed(2)}</span>
        },
        {
            header: 'Merma', accessor: 'shrinkagePercentage',
            render: (_, row) => (
                <Badge color={(row.shrinkagePercentage ?? 0) > 5 ? 'warning' : 'success'}>
                    {(row.shrinkagePercentage ?? 0).toFixed(2)}%
                </Badge>
            )
        },
        {
            header: 'Costo total', accessor: 'totalCost',
            type: 'number',
            bgColor: '#f3e5f5',
            render: (_, row) => <span className="fw-semibold">${(row.totalCost ?? 0).toFixed(2)}</span>
        },
        {
            header: 'Costo / kg', accessor: 'costPerKg',
            type: 'number',
            bgColor: '#e0f7fa',
            render: (_, row) => <span className="fw-medium">${(row.costPerKg ?? 0).toFixed(2)}</span>
        },
        {
            header: 'Responsable', accessor: 'responsible.name',
            render: (_, row) => <span>{row.responsible?.name} {row.responsible?.lastname}</span>
        },
        {
            header: 'Acciones', accessor: 'action',
            render: (_, row) => (
                <Button className="farm-primary-button btn-icon" title="Ver detalles" onClick={() => { setSelectedPreparation(row); toggleModal('details'); }}>
                    <i className="ri-eye-fill align-middle"></i>
                </Button>
            ),
        },
    ];

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEED_PREPARATION_URLS.findByFarm(userLogged.farm_assigned)}`);
            setPreparations(response.data.data || []);
        } catch (error) {
            console.error('Error fetching preparations:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al cargar las preparaciones' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Preparaciones de alimento" pageTitle="Alimentación" />

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                Preparar alimento
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={preparations.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : ""}>
                        {preparations.length === 0 ? (
                            <>
                                <FiInbox className="text-muted" size={48} style={{ marginBottom: 10 }} />
                                <span className="fs-5 text-muted">Aún no hay preparaciones registradas</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={preparations} showPagination={true} rowsPerPage={10} fontSize={14} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Preparar alimento</ModalHeader>
                <ModalBody>
                    <FeedPreparationForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => toggleModal('create', false)} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("details")}>Detalle de preparación</ModalHeader>
                <ModalBody>
                    {selectedPreparation?._id && (
                        <FeedPreparationDetails preparationId={selectedPreparation._id} />
                    )}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default ViewFeedPreparations;
