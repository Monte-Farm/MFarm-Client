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

interface VaccinationPlanDetailsProps {
    vaccinationPlanId: string;
}

const VaccinationPlanDetails: React.FC<VaccinationPlanDetailsProps> = ({ vaccinationPlanId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [vaccinationPlanDetails, setVaccinationPlanDetails] = useState<any>({});
    const [vaccinationItems, setVaccinationItems] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [modals, setModals] = useState({ deactivateVaccinationPlan: false, activateVaccinationPlan: false, deactivationSuccess: false, activationSuccess: false, deactivationError: false, activationError: false });
    const [isSubmitting, setSubmitting] = useState<boolean>(false);

    const vaccinationPlanAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'creation_date', label: 'Fecha de creacion', type: 'date' },
        {
            key: 'stage',
            label: 'Etapa',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.stage) {
                    case "piglet":
                        color = "info";
                        text = "Lechon";
                        break;
                    case "weaning":
                        color = "info";
                        text = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        text = "Engorda";
                        break;
                    case "breeder":
                        color = "primary";
                        text = "Reproductor";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: 'creation_responsible',
            label: 'Responsable de registo',
            type: 'text',
            render: (_, obj) => (<span className="text-black">{userLogged.name} {userLogged.lastname}</span>)
        },

    ]

    const vaccinesColumns: Column<any>[] = [
        {
            header: "Codigo",
            accessor: "vaccine.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.vaccine.id,
        },
        {
            header: "Vacuna",
            accessor: "name",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.vaccine.name,

        },
        {
            header: "Dosis",
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => `${row.dose} ${row.vaccine?.unit_measurement || ''}`,
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
                    case "protocol":
                        color = "primary";
                        label = "Protocolo";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Edad objetivo",
            accessor: "age_objective",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.age_objective} dias</span>
        },
        {
            header: "Frecuencia",
            accessor: "frequency",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "single":
                        color = "info";
                        label = "Única dosis";
                        break;
                    case "single_booster":
                        color = "primary";
                        label = "Única dosis + refuerzo";
                        break;
                    case "3_weeks":
                        color = "primary";
                        label = "Cada 3 semanas";
                        break;
                    case "4_weeks":
                        color = "primary";
                        label = "Cada 4 semanas";
                        break;
                    case "6_weeks":
                        color = "primary";
                        label = "Cada 6 semanas";
                        break;
                    case "12_weeks":
                        color = "primary";
                        label = "Cada 12 semanas";
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
        if (!configContext || !userLogged || !vaccinationPlanId) return;
        try {
            setLoading(true);
            const [vaccinationResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/vaccination_plan/find_by_id/${vaccinationPlanId}`)
            ])
            const vaccinationPlanData = vaccinationResponse.data.data;
            setVaccinationPlanDetails(vaccinationPlanData);
            setVaccinationItems(vaccinationPlanData.vaccines)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        }
    }

    const deactivateVaccinationPlan = async () => {
        if (!configContext || !userLogged || !vaccinationPlanId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/vaccination_plan/deactivate/${vaccinationPlanId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Plan de vacunacion ${vaccinationPlanDetails.code} desactivado`
                });

                toggleModal('deactivationSuccess')
            }
        } catch (error) {
            toggleModal('deactivationError')
        } finally {
            setSubmitting(false)
        }
    }

    const activateVaccinationPlan = async () => {
        if (!configContext || !userLogged || !vaccinationPlanId) return;
        try {
            setSubmitting(true);
            const deactivateResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/vaccination_plan/activate/${vaccinationPlanId}`, {})

            if (deactivateResponse.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Plan de vacunacion ${vaccinationPlanDetails.code} activado`
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

    return (
        <>
            <div className="d-flex gap-2 mb-3 justify-content-end">
                {vaccinationPlanDetails.is_active ? (
                    <Button className="btn-danger" onClick={() => toggleModal('deactivateVaccinationPlan')}>
                        <i className="ri-forbid-line align-middle me-2 fs-5" />
                        Desactivar plan de vacunacion
                    </Button>
                ) : (
                    <Button className="btn-success" onClick={() => toggleModal('activateVaccinationPlan')}>
                        <i className="ri-check-line align-middle me-2 fs-5" />
                        Activar plan de vacunacion
                    </Button>
                )}

            </div>
            <div className="d-flex gap-3">
                <Card className="w-25">
                    <CardHeader className="bg-light">
                        <h5>Informacion del plan de vacunacion</h5>
                    </CardHeader>
                    <CardBody>
                        <ObjectDetails attributes={vaccinationPlanAttributes} object={vaccinationPlanDetails} />
                    </CardBody>
                </Card>

                <Card className="w-75">
                    <CardHeader className="bg-light">
                        <h5>Vacunas del plan</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={vaccinesColumns} data={vaccinationItems} showSearchAndFilter={false} showPagination={true} rowsPerPage={5} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="md" isOpen={modals.deactivateVaccinationPlan} toggle={() => toggleModal("deactivateVaccinationPlan")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("deactivateVaccinationPlan")}>Desactivar plan de vacunacion</ModalHeader>
                <ModalBody>
                    <p>¿Está seguro que desea desactivar este plan de vacunacion?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('deactivateVaccinationPlan', false)}>Cancelar</Button>
                    <Button color="danger" onClick={() => { toggleModal('deactivateVaccinationPlan'); deactivateVaccinationPlan() }}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            <Modal size="md" isOpen={modals.activateVaccinationPlan} toggle={() => toggleModal("activateVaccinationPlan")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activateVaccinationPlan")}>Activar paquete de medicaciones</ModalHeader>
                <ModalBody>
                    <p>¿Está seguro que desea activar este plan de vacunacion?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('activateVaccinationPlan', false)}>Cancelar</Button>
                    <Button color="danger" onClick={() => { toggleModal('activateVaccinationPlan'); activateVaccinationPlan() }}>Confirmar</Button>
                </ModalFooter>
            </Modal>


            <SuccessModal isOpen={modals.deactivationSuccess} onClose={() => { toggleModal('deactivationSuccess'); fetchData() }} message={"Plan de vacunacion desactivado con exito"} />
            <SuccessModal isOpen={modals.activationSuccess} onClose={() => { toggleModal('activationSuccess'); fetchData() }} message={"Plan de vacunacionactivado con exito"} />

            <ErrorModal isOpen={modals.deactivationError} onClose={() => { toggleModal('deactivationError') }} message={"Ha ocurrido un error al desactivar el plan de vacunacion, intentelo mas tarde"} />
            <ErrorModal isOpen={modals.activationError} onClose={() => { toggleModal('activationError') }} message={"Ha ocurrido un error al activar el plan de vacunacion, intentelo mas tarde"} />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default VaccinationPlanDetails;