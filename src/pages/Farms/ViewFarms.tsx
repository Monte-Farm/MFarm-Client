import { Column } from "common/data/data_types"
import { ConfigContext } from "App";
import { FarmData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState, useMemo } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Input, Modal, ModalBody, ModalHeader } from "reactstrap";
import FarmCards from "Components/Common/Lists/FarmCards";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { useNavigate } from "react-router-dom";
import FarmForm from "Components/Common/Forms/FarmForm";

const ViewFarms = () => {
    document.title = 'Granjas | System Pig'
    const configContext = useContext(ConfigContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [farms, setFarms] = useState<FarmData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modals, setModals] = useState({ details: false, create: false, update: false, delete: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [selectedFarm, setSelectedFarm] = useState<FarmData | null>(null);

    const farmColumns: Column<FarmData>[] = [
        { accessor: "name", header: "Nombre" },
        { accessor: "code", header: "Código" },
        { accessor: "location", header: "Ubicación" },
        {
            header: 'Estado',
            accessor: 'status',
            isFilterable: true,
            render: (value: boolean) => (
                <Badge color={value ? 'success' : 'danger'}>
                    {value ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const fetchFarms = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/find_all`)
            setFarms(response.data.data)
        } catch (error) {
            console.error('Error fetching the farms:', error);
            handleError(error, 'Ha ocurrido un error al recuperar las granjas, intentelo más tarde');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFarms();
    }, [])

    const filteredFarms = useMemo(() => {
        if (!searchTerm) return farms;
        const lowerSearch = searchTerm.toLowerCase();
        return farms.filter(farm =>
            farmColumns.some(col => {
                const value = (farm as any)[col.accessor];
                if (value === undefined || value === null) return false;
                return value.toString().toLowerCase().includes(lowerSearch);
            })
        );
    }, [searchTerm, farms, farmColumns]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver granjas"} pageTitle={"Granjas"} />

                <Card style={{ minHeight: "calc(100vh - 262px)" }}>
                    <CardHeader>
                        <div className="d-flex gap-3">
                            <Input
                                placeholder="Buscar granja..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="fs-5"
                            />
                            <Button
                                className="ms-auto farm-primary-button fs-5"
                                onClick={() => toggleModal('create')}
                                style={{ width: '200px' }}
                            >
                                <i className="ri-add-line me-3" />
                                Nueva granja
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody>
                        <FarmCards
                            columns={farmColumns}
                            data={filteredFarms}
                            onDetailsClick={(farm) => navigate(`/farms/farm_details/${farm._id}`)}
                            onEditClick={(farm) => {
                                setSelectedFarm(farm);
                                toggleModal('update', true);
                            }}
                            onCardClick={(farm) => navigate(`/farms/farm_details/${farm._id}`)}
                            imageAccessor="image"
                        />
                    </CardBody>
                </Card>
            </Container>

            {/* Modal Crear */}
            <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop='static' centered>
                <ModalHeader toggle={() => toggleModal('create')}>Nueva Granja</ModalHeader>
                <ModalBody>
                    <FarmForm
                        onSave={() => {
                            toggleModal('create');
                            fetchFarms();
                            showAlert('success', 'Granja creada correctamente');
                        }}
                        onCancel={() => toggleModal('create')}
                    />
                </ModalBody>
            </Modal>

            {/* Modal Editar */}
            <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
                <ModalHeader toggle={() => toggleModal('update')}>Editar Granja</ModalHeader>
                <ModalBody>
                    <FarmForm
                        data={selectedFarm || undefined}
                        onSave={() => {
                            toggleModal('update');
                            fetchFarms();
                            showAlert('success', 'Granja actualizada correctamente');
                            setSelectedFarm(null);
                        }}
                        onCancel={() => {
                            toggleModal('update');
                            setSelectedFarm(null);
                        }}
                    />
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    );
}

export default ViewFarms;