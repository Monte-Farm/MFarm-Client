import { ConfigContext } from "App"
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react"
import AlertMessage from "../Shared/AlertMesagge";
import { Badge, Button, Card, CardBody, CardHeader, Spinner } from "reactstrap";
import ObjectDetails from "./ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import LoadingAnimation from "../Shared/LoadingAnimation";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import KPI from "../Graphics/Kpi";
import { IconBaseProps } from "react-icons";
import { FaExclamationTriangle, FaHeart, FaMars, FaPiggyBank, FaSkull, FaVenus } from "react-icons/fa";

interface BirthDetailsProps {
    birthId: string
}

const BirthDetails: React.FC<BirthDetailsProps> = ({ birthId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [birthDetails, setBirthDetails] = useState<any>({})
    const [pregnancyDetails, setPregnancyDetails] = useState<any>({})
    const [sowDetails, setSowDetails] = useState<any>({})
    const [litterDetails, setLitterDetails] = useState<any>({})
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })

    const BirthAttributes: Attribute[] = [
        { key: 'birth_date', label: 'Fecha de parto', type: 'date' },
        {
            key: 'birth_type',
            label: 'Tipo de parto',
            type: 'text',
            render: (value: string) => {
                let color = '';
                let label = '';

                switch (value) {
                    case 'normal': color = 'success'; label = 'Normal'; break;
                    case 'cesarean': color = 'primary'; label = 'Cesárea'; break;
                    case 'abortive': color = 'danger'; label = 'Abortivo'; break;
                    case 'dystocia': color = 'warning'; label = 'Distócico'; break;
                    case 'induced': color = 'info'; label = 'Inducido'; break;
                    default: color = 'secondary'; label = 'Sin especificar';
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'assisted',
            label: 'Asistido',
            type: 'text',
            render: (_, obj) => (
                <Badge color={obj.assisted ? 'success' : 'warning'}>{obj.assisted ? 'Sí' : 'No'}</Badge>
            )
        },
        {
            key: 'responsible',
            label: 'Responsable',
            type: 'text',
            render: (_, row) => <span className="text-black">{row.responsible.name} {row.responsible.lastname}</span>
        },
    ]

    const sowAttributes: Attribute[] = [
        { key: "code", label: "Código", type: "text" },
        { key: "birthdate", label: "Fecha de nacimiento", type: "date" },
        { key: "breed", label: "Raza", type: "text" },
        {
            key: "origin",
            label: "Origen",
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'born':
                        color = 'success';
                        label = 'Nacido en la granja';
                        break;

                    case 'purchased':
                        color = 'warning';
                        label = 'Comprado';
                        break;

                    case 'donated':
                        color = 'info';
                        label = 'Donado';
                        break;

                    case 'other':
                        color = 'dark';
                        label = 'Otro';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "weight", label: "Peso actual", type: "text" },
        {
            key: "status",
            label: "Estado",
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;
                switch (value) {
                    case 'alive': color = 'success'; label = 'Vivo'; break;
                    case 'discarded': color = 'warning'; label = 'Descartado'; break;
                    case 'dead': color = 'danger'; label = 'Muerto'; break;
                }
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "observations", label: "Observaciones", type: "text" },
    ]

    const pregnancyAttributes: Attribute[] = [
        { key: "start_date", label: "Fecha inseminación", type: "date" },
        { key: "estimated_farrowing_date", label: "Fecha de parto prevista", type: "date" },
    ]

    const pigletsColumns: Column<any>[] = [
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: 'Peso', accessor: 'weight', type: 'text', isFilterable: true },
        // {
        //     header: 'Estado',
        //     accessor: 'status',
        //     render: (value: string) => (
        //         <Badge color={value === 'alive' ? "info" : "danger"}>
        //             {value === 'alive' ? "Vivo" : "Muerto"}
        //         </Badge>
        //     ),
        // },
    ]

    const fetchData = async () => {
        if (!configContext || !birthId) return;
        try {
            setLoading(true);

            const birthResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/births/find_by_id/${birthId}`);
            const birthData = birthResponse.data.data;
            setBirthDetails(birthData);

            const [sowResponse, pregnancyResponse, litterResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${birthData.sow}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/find_by_id/${birthData.pregnancy}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_birth/${birthId}`),
            ]);

            setSowDetails(sowResponse.data.data);
            setPregnancyDetails(pregnancyResponse.data.data);
            setLitterDetails(litterResponse.data.data);
        } catch (error) {
            console.error('Error al obtener los datos', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al recuperar los datos, inténtelo más tarde' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        );
    }

    return (
        <>
            <div className="d-flex gap-3">
                <KPI title="Nacidos vivos" value={birthDetails.born_alive} icon={FaHeart} bgColor="#E6F9F0" iconColor="#28A745" />
                <KPI title="Nacidos muertos" value={birthDetails.stillborn} icon={FaSkull} bgColor="#FDECEA" iconColor="#DC3545" />
                <KPI title="Momias" value={birthDetails.mummies} icon={FaExclamationTriangle} bgColor="#FFF4E5" iconColor="#FD7E14" />
            </div>

            <div className="d-flex gap-3 align-items-stretch">
                <div className="w-100 d-flex flex-column">
                    <Card className="flex-fill shadow-sm mb-3">
                        <CardHeader className="bg-light">
                            <h5>Información del parto</h5>
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails attributes={BirthAttributes} object={birthDetails} />
                        </CardBody>
                    </Card>

                    <Card className="flex-fill shadow-sm">
                        <CardHeader className="bg-light">
                            <h5>Información del embarazo</h5>
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails attributes={pregnancyAttributes} object={pregnancyDetails} />
                        </CardBody>
                    </Card>
                </div>

                <div className="w-100 d-flex flex-column">
                    <Card className="flex-fill shadow-sm">
                        <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                            <span className="text-black fs-5">Cerda inseminada</span>
                            <Button color="link" onClick={() => navigate(`/pigs/pig_details/${sowDetails._id}`)}>
                                Información ↗
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails attributes={sowAttributes} object={sowDetails} />
                        </CardBody>
                    </Card>
                </div>

                <div className="w-100 d-flex flex-column">
                    <Card className="flex-fill shadow-sm">
                        <CardHeader className="bg-light d-flex justify-content-between align-items-center fs-5">
                            <span className="text-black fs-5">Camada</span>
                            <Button color="link" onClick={() => navigate(`/lactation/litter_details/${litterDetails._id}`)}>
                                Información ↗
                            </Button>
                        </CardHeader>
                        <CardBody className="p-0">
                            <CustomTable columns={pigletsColumns} data={litterDetails.piglets} showSearchAndFilter={false} showPagination rowsPerPage={7} />
                        </CardBody>
                    </Card>
                </div >
            </div >

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false}
            />
        </>
    );
};

export default BirthDetails;