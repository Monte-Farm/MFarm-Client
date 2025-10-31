import { ConfigContext } from "App"
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react"
import AlertMessage from "../Shared/AlertMesagge";
import { Badge, Button, Card, CardBody, CardHeader, Spinner } from "reactstrap";
import ObjectDetails from "../ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

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
        { key: "origin", label: "Origen", type: "text" },
        { key: "weight", label: "Peso actual", type: "text" },
        {
            key: "status",
            label: "Estado",
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;
                switch (value) {
                    case 'vivo': color = 'success'; label = 'Vivo'; break;
                    case 'descartado': color = 'warning'; label = 'Descartado'; break;
                    case 'muerto': color = 'danger'; label = 'Muerto'; break;
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

    const simpleLitterPigs: Attribute[] = [
        { key: 'pigCount', label: 'Lechones', type: 'text' },
        { key: 'avg_weight', label: 'Peso promedio', type: 'text' },
    ]

    const fetchData = async () => {
        if (!configContext) return;
        try {
            setLoading(true);

            const birthResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/births/find_by_id/${birthId}`);
            const birthData = birthResponse.data.data;
            setBirthDetails(birthData);

            const [sowResponse, pregnancyResponse, litterResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${birthData.sow}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/find_by_id/${birthData.pregnancy}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${birthData.litter}`),
            ]);

            setPregnancyDetails(pregnancyResponse.data.data);
            setSowDetails(sowResponse.data.data);
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
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '250px' }}>
                <Spinner color="primary" style={{ width: '2rem', height: '2rem' }} />
            </div>
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
                        <CardHeader className="bg-light">
                            <h5>Camada</h5>
                        </CardHeader>
                        <CardBody className={`${litterDetails.pigsInGroup.length === 0 ? '' : 'p-2'}`} style={{ height: "450px" }}>
                            {litterDetails.pigsInGroup.length === 0 ? (
                                <>
                                    <ObjectDetails attributes={simpleLitterPigs} object={litterDetails} />
                                </>
                            ) : (
                                <>
                                    <SimpleBar style={{ maxHeight: "100%" }}>
                                        <div className="d-flex flex-column gap-3">
                                            {litterDetails?.pigsInGroup?.map((pig: any, idx: number) => (
                                                <div key={pig._id} className="d-flex p-2 border rounded bg-light">
                                                    <div className="d-flex align-items-center justify-content-center bg-secondary text-white rounded me-3" style={{ width: "50px", fontWeight: 600 }}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-grow-1 d-flex flex-column gap-1 fs-5">
                                                        <div className="d-flex justify-content-between">
                                                            <span className="fw-semibold text-black">Código:</span>
                                                            <span className="text-black">{pig.code}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="fw-semibold text-black">Peso:</span>
                                                            <span className="text-black">{pig.weight}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="fw-semibold text-black">Sexo:</span>
                                                            <Badge color={pig.sex === 'macho' ? "info" : "danger"}>
                                                                {pig.sex === 'macho' ? "♂ Macho" : "♀ Hembra"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </SimpleBar>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </div >
            </div >

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                absolutePosition={false}
            />
        </>
    );
};

export default BirthDetails;