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

interface MedicationPackageDetailsProps {
    medicationPackageId: string;
}

const MedicationPackageDetails: React.FC<MedicationPackageDetailsProps> = ({ medicationPackageId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [medicationPackageDetails, setMedicationPackageDetails] = useState<any>({});
    const [medicationsItems, setMedicationsItems] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [modals, setModals] = useState({ deactivateMedicationPackage: false, activateMedicationPackage: false, deactivationSuccess: false, activationSuccess: false, deactivationError: false, activationError: false });
    const [isSubmitting, setSubmitting] = useState<boolean>(false);

    const medicationAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'creation_date', label: 'Fecha de creacion', type: 'date' },
        {
            label: 'Etapa',
            key: 'stage',
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
        { key: 'description', label: 'Descripcion', type: 'text' },
        {
            key: 'creation_responsible',
            label: 'Responsable de registo',
            type: 'text',
            render: (_, obj) => (<span className="text-black">{medicationPackageDetails?.creation_responsible?.name} {medicationPackageDetails?.creation_responsible?.lastname} </span>)
        },
        {
            key: 'is_active', label: 'Estado', render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{value ? "Activo" : "Inactivo"}</Badge>
            ),
        },
    ]

    const medicationsColumns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.medication.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        {
            header: "Codigo",
            accessor: "medication.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.medication.id,
        },
        {
            header: "Producto",
            accessor: "name",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.medication.name,

        },
        {
            header: 'Categoria',
            accessor: 'category',
            render: (_, row) => {
                let color = "secondary";
                let label = 'Desconocido';

                switch (row.medication?.category) {
                    case "medications":
                        color = "info";
                        label = "Medicamentos";
                        break;
                    case "vaccines":
                        color = "primary";
                        label = "Vacunas";
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
            render: (_, row) => `${row.quantity} ${row.medication?.unit_measurement || ''}`,
        },
        {
            header: "Administracion",
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "oral":
                        color = "info";
                        label = "Oral";
                        break;
                    case "intramuscular":
                        color = "primary";
                        label = "Intramuscular";
                        break;
                    case "subcutaneous":
                        color = "primary";
                        label = "Subcutánea";
                        break;
                    case "intravenous":
                        color = "primary";
                        label = "Intravenosa";
                        break;
                    case "intranasal":
                        color = "primary";
                        label = "Intranasal";
                        break;
                    case "topical":
                        color = "primary";
                        label = "Tópica";
                        break;
                    case "rectal":
                        color = "primary";
                        label = "Rectal";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const [medicationResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/find_by_id/${medicationPackageId}`)
            ])
            const medicationData = medicationResponse.data.data;
            setMedicationPackageDetails(medicationData);
            setMedicationsItems(medicationData.medications)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const deactivateMedicationPackage = async () => {
        if (!configContext || !userLogged || !medicationPackageId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/medication_package/deactivate/${medicationPackageId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicamentos ${medicationPackageDetails.code} desactivado`
                });

                toggleModal('deactivationSuccess')
            }
        } catch (error) {
            toggleModal('deactivationError')
        } finally {
            setSubmitting(false)
        }
    }

    const activateMedicationPackage = async () => {
        if (!configContext || !userLogged || !medicationPackageId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/medication_package/activate/${medicationPackageId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicamentos ${medicationPackageDetails.code} activado`
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
                        {medicationPackageDetails.is_active ? (
                            <Button className="btn-danger" onClick={() => toggleModal('deactivateMedicationPackage')}>
                                <i className="ri-forbid-line align-middle me-2 fs-5" />
                                Desactivar paquete
                            </Button>
                        ) : (
                            <Button className="btn-success" onClick={() => toggleModal('activateMedicationPackage')}>
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
                        <ObjectDetails attributes={medicationAttributes} object={medicationPackageDetails} />
                    </CardBody>
                </Card>

                <Card className="w-75">
                    <CardHeader className="bg-light">
                        <h5>Medicamentos del paquete</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={medicationsColumns} data={medicationsItems} showSearchAndFilter={false} showPagination={true} rowsPerPage={5} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="md" isOpen={modals.deactivateMedicationPackage} toggle={() => toggleModal("deactivateMedicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("deactivateMedicationPackage")}>Desactivar paquete de medicaciones</ModalHeader>
                <ModalBody>
                    <p>¿Está seguro que desea desactivar este paquete de medicaciones?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('deactivateMedicationPackage', false)}>Cancelar</Button>
                    <Button color="danger" onClick={() => { toggleModal('deactivateMedicationPackage'); deactivateMedicationPackage() }}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            <Modal size="md" isOpen={modals.activateMedicationPackage} toggle={() => toggleModal("activateMedicationPackage")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activateMedicationPackage")}>Activar paquete de medicaciones</ModalHeader>
                <ModalBody>
                    <p>¿Está seguro que desea activar este paquete de medicaciones?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('activateMedicationPackage', false)}>Cancelar</Button>
                    <Button color="danger" onClick={() => { toggleModal('activateMedicationPackage'); activateMedicationPackage() }}>Confirmar</Button>
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

export default MedicationPackageDetails;