import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "./ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { Badge, Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import noImageUrl from '../../../assets/images/no-image.png'
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { HttpStatusCode } from "axios";
import LoadingAnimation from "../Shared/LoadingAnimation";

interface FeedingPackageDetailsProps {
    feedingPackageId: string;
}

const FeedingPackageDetails: React.FC<FeedingPackageDetailsProps> = ({ feedingPackageId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [feedingPackageDetails, setFeedingPackageDetails] = useState<any>({});
    const [feedingsItems, setFeedingsItems] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [modals, setModals] = useState({ deactivateFeedingPackage: false, activateFeedingPackage: false, deactivationSuccess: false, activationSuccess: false, deactivationError: false, activationError: false });
    const [isSubmitting, setSubmitting] = useState<boolean>(false);

    const feedingAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'creation_date', label: 'Fecha de creacion', type: 'date' },
        {
            key: 'destination_area',
            label: 'Area de destino',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.destination_area) {
                    case "general":
                        color = "info";
                        text = "General";
                        break;
                    case "gestation":
                        color = "info";
                        text = "Gestación";
                        break;
                    case "farrowing":
                        color = "primary";
                        text = "Paridera";
                        break;
                    case "maternity":
                        color = "primary";
                        text = "Maternidad";
                        break;
                    case "weaning":
                        color = "success";
                        text = "Destete";
                        break;
                    case "nursery":
                        color = "warning";
                        text = "Preceba";
                        break;
                    case "fattening":
                        color = "dark";
                        text = "Ceba";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo";
                        break;
                    case "boars":
                        color = "info";
                        text = "Área de verracos";
                        break;
                    case "quarantine":
                        color = "danger";
                        text = "Cuarentena";
                        break;
                    case "hospital":
                        color = "danger";
                        text = "Hospital";
                        break;
                    case "shipping":
                        color = "secondary";
                        text = "Corrales de venta";
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
            key: 'objective_use',
            label: 'Objetivo de uso',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.objective_use) {
                    case "individual":
                        color = "info";
                        text = "Individual";
                        break;
                    case "group":
                        color = "info";
                        text = "Grupal";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: 'periodicity',
            label: 'Periodicidad',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.periodicity) {
                    case "once_day":
                        color = "info";
                        text = "1 vez al día";
                        break;
                    case "twice_day":
                        color = "primary";
                        text = "2 veces al día";
                        break;
                    case "three_times_day":
                        color = "warning";
                        text = "3 veces al día";
                        break;
                    case "ad_libitum":
                        color = "success";
                        text = "Libre acceso";
                        break;
                    case "weekly":
                        color = "secondary";
                        text = "1 vez a la semana";
                        break;
                    case "biweekly":
                        color = "warning";
                        text = "Cada 15 días";
                        break;
                    case "monthly":
                        color = "dark";
                        text = "Mensual";
                        break;
                    case "specific_days":
                        color = "primary";
                        text = "Días específicos";
                        break;
                    case "by_event":
                        color = "danger";
                        text = "Por evento productivo";
                        break;
                    default:
                        color = "light";
                        text = "No definido";
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        { key: 'description', label: 'Descripcion', type: 'text' },
        {
            key: 'creation_responsible',
            label: 'Responsable de registo',
            type: 'text',
            render: (_, obj) => (<span className="text-black">{feedingPackageDetails?.creation_responsible?.name} {feedingPackageDetails?.creation_responsible?.lastname} </span>)
        },
        {
            key: 'is_active', label: 'Estado', render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{value ? "Activo" : "Inactivo"}</Badge>
            ),
        },
    ]

    const feedingsColumns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.feeding.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        {
            header: "Codigo",
            accessor: "feeding.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.feeding.id,
        },
        {
            header: "Producto",
            accessor: "name",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.feeding.name,

        },
        {
            header: 'Categoria',
            accessor: 'category',
            render: (_, row) => {
                let color = "secondary";
                let label = 'Desconocido';

                switch (row.feeding?.category) {
                    case "nutrition":
                        color = "info";
                        label = "Nutricion";
                        break;
                    case "vitamins":
                        color = "primary";
                        label = "Vitaminas";
                        break;
                    case "minerals":
                        color = "primary";
                        label = "Minerales";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Cantidad",
            accessor: "quantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => `${row.quantity} ${row.feeding?.unit_measurement || ''}`,
        },
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLogged || !feedingPackageId) return;
        try {
            setLoading(true);
            const [feedingResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/feeding_package/find_by_id/${feedingPackageId}`)
            ])
            const feedingData = feedingResponse.data.data;
            setFeedingPackageDetails(feedingData);
            setFeedingsItems(feedingData.feedings)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const deactivateFeedingPackage = async () => {
        if (!configContext || !userLogged || !feedingPackageId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/feeding_package/deactivate/${feedingPackageId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicamentos ${feedingPackageDetails.code} desactivado`
                });

                toggleModal('deactivationSuccess')
            }
        } catch (error) {
            toggleModal('deactivationError')
        } finally {
            setSubmitting(false)
        }
    }

    const activateFeedingPackage = async () => {
        if (!configContext || !userLogged || !feedingPackageId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/feeding_package/activate/${feedingPackageId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicamentos ${feedingPackageDetails.code} activado`
                });

                toggleModal('activationSuccess')
            }
        } catch (error) {
            toggleModal('activationError')
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <div className="d-flex gap-2 mb-3 justify-content-end">
                {userLogged.role.includes('veterinarian') || userLogged.role.includes('farm_manager') ? (
                    <>
                        {feedingPackageDetails.is_active ? (
                            <Button className="btn-danger" onClick={() => toggleModal('deactivateFeedingPackage')}>
                                <i className="ri-forbid-line align-middle me-2 fs-5" />
                                Desactivar paquete
                            </Button>
                        ) : (
                            <Button className="btn-success" onClick={() => toggleModal('activateFeedingPackage')}>
                                <i className="ri-check-line align-middle me-2 fs-5" />
                                Activar paquete
                            </Button>
                        )}
                    </>
                ) : null}

            </div>
            <div className="d-flex gap-3">
                <Card className="w-25">
                    <CardHeader className="bg-light">
                        <h5>Informacion del paquete</h5>
                    </CardHeader>
                    <CardBody>
                        <ObjectDetails attributes={feedingAttributes} object={feedingPackageDetails} />
                    </CardBody>
                </Card>

                <Card className="w-75">
                    <CardHeader className="bg-light">
                        <h5>Alimentos del paquete</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={feedingsColumns} data={feedingsItems} showSearchAndFilter={false} showPagination={true} rowsPerPage={5} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="md" isOpen={modals.deactivateFeedingPackage} toggle={() => toggleModal("deactivateFeedingPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("deactivateFeedingPackage")}>Desactivar paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <p>¿Está seguro que desea desactivar este paquete de alimentacion?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('deactivateFeedingPackage', false)}>Cancelar</Button>
                    <Button color="danger" onClick={() => { toggleModal('deactivateFeedingPackage'); deactivateFeedingPackage() }}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            <Modal size="md" isOpen={modals.activateFeedingPackage} toggle={() => toggleModal("activateFeedingPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activateFeedingPackage")}>Activar paquete de alimentacion</ModalHeader>
                <ModalBody>
                    <p>¿Está seguro que desea activar este paquete de alimentacion?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('activateFeedingPackage', false)}>Cancelar</Button>
                    <Button color="danger" onClick={() => { toggleModal('activateFeedingPackage'); activateFeedingPackage() }}>Confirmar</Button>
                </ModalFooter>
            </Modal>


            <SuccessModal isOpen={modals.deactivationSuccess} onClose={() => { toggleModal('deactivationSuccess'); fetchData() }} message={"Paquete desactivado con exito"} />
            <SuccessModal isOpen={modals.activationSuccess} onClose={() => { toggleModal('activationSuccess'); fetchData() }} message={"Paquete activado con exito"} />

            <ErrorModal isOpen={modals.deactivationError} onClose={() => { toggleModal('deactivationError') }} message={"Ha ocurrido un error al desactivar el paquete, intentelo mas tarde"} />
            <ErrorModal isOpen={modals.activationError} onClose={() => { toggleModal('activationError') }} message={"Ha ocurrido un error al activar el paquete, intentelo mas tarde"} />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default FeedingPackageDetails;