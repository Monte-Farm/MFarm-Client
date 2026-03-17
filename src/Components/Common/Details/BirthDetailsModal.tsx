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
                        <CardBody className="p-2">
                            {/* Estadísticas principales */}
                            <div className="row g-3 mb-3">
                                <div className="col-md-4">
                                    <div className="border rounded p-2 text-center bg-light">
                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                            <i className="ri-parent-line fs-5 text-primary me-1"></i>
                                            <small className="text-muted">Total Vivos</small>
                                        </div>
                                        <h4 className="mb-0 text-primary fw-bold">{litterDetails?.currentMale + litterDetails?.currentFemale}</h4>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="border rounded p-2 text-center bg-light">
                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                            <i className="ri-men-line fs-5 text-info me-1"></i>
                                            <small className="text-muted">Machos</small>
                                        </div>
                                        <h4 className="mb-0 text-info fw-bold">{litterDetails?.currentMale}</h4>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="border rounded p-2 text-center bg-light">
                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                            <i className="ri-women-line fs-5 text-danger me-1"></i>
                                            <small className="text-muted">Hembras</small>
                                        </div>
                                        <h4 className="mb-0 text-danger fw-bold">{litterDetails?.currentFemale}</h4>
                                    </div>
                                </div>
                            </div>

                            {/* Información adicional */}
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <div className="border rounded p-2 text-center">
                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                            <i className="ri-scales-3-line fs-5 text-success me-1"></i>
                                            <small className="text-muted">Peso Promedio</small>
                                        </div>
                                        <h4 className="mb-0 text-success fw-bold">
                                            {litterDetails?.piglets?.length > 0 
                                                ? (litterDetails?.piglets?.reduce((acc: number, p: any) => acc + Number(p.weight), 0) / litterDetails?.piglets?.length).toFixed(2)
                                                : '0.00'
                                            } kg
                                        </h4>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="border rounded p-2 text-center">
                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                            <i className="ri-calculator-line fs-5 text-primary me-1"></i>
                                            <small className="text-muted">Peso Total</small>
                                        </div>
                                        <h4 className="mb-0 text-primary fw-bold">
                                            {litterDetails?.piglets?.reduce((acc: number, p: any) => acc + Number(p.weight), 0).toFixed(2)} kg
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            
                            {/* Tabla detallada (opcional, más pequeña) */}
                            {litterDetails?.piglets?.length > 0 && (
                                <div className="mt-3">
                                    <small className="text-muted fw-semibold d-block mb-2">Detalles individuales:</small>
                                    <SimpleBar style={{ maxHeight: 200 }}>
                                        <div className="table-responsive">
                                            <table className="table table-sm table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="text-center">#</th>
                                                        <th className="text-center">Sexo</th>
                                                        <th className="text-center">Peso (kg)</th>
                                                        <th className="text-center">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {litterDetails?.piglets?.map((piglet: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="text-center">{index + 1}</td>
                                                            <td className="text-center">
                                                                <Badge color={piglet.sex === 'male' ? "info" : "danger"} style={{ fontSize: '0.75rem' }}>
                                                                    {piglet.sex === 'male' ? "♂" : "♀"}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-center">{Number(piglet.weight).toFixed(2)}</td>
                                                            <td className="text-center">
                                                                <Badge color={piglet.status === 'alive' ? "success" : "danger"} style={{ fontSize: '0.75rem' }}>
                                                                    {piglet.status === 'alive' ? "Vivo" : "Muerto"}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </SimpleBar>
                                </div>
                            )}
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