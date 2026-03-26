import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import { getLoggedinUser } from "helpers/api_helper";
import { config } from "process";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container } from "reactstrap";
import BulkMedicationAssignmentModal from "Components/Common/Forms/BulkMedicationAssignmentModal";
import BulkFeedingAssignmentModal from "Components/Common/Forms/BulkFeedingAssignmentModal";
import BulkWeanLittersModal from "Components/Common/Forms/BulkWeanLittersModal";

const ViewLitters = () => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true)
    const [litters, setLitters] = useState<any[]>([])
    const [selectedLitters, setSelectedLitters] = useState<any[]>([])
    const [bulkMedicationModalOpen, setBulkMedicationModalOpen] = useState(false);
    const [bulkFeedingModalOpen, setBulkFeedingModalOpen] = useState(false);
    const [bulkWeanModalOpen, setBulkWeanModalOpen] = useState(false);

    const handleSelectionChange = (selected: any[]) => {
        setSelectedLitters(selected);
    };

    const hasActiveLitters = selectedLitters.some(litter => litter.status === 'active');
    const hasReadyToWeanLitters = selectedLitters.some(litter => litter.status === 'ready_to_wean' || litter.status === 'wean_overdue');

    const handleBulkMedicationSuccess = () => {
        fetchLitter();
        setSelectedLitters([]);
    };

    const handleBulkFeedingSuccess = () => {
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
                    <CardHeader className="d-flex justify-content-between align-items-center">
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
                                            title={!hasActiveLitters ? "No hay camadas activas para asignar alimentación" : undefined}
                                            onClick={() => setBulkFeedingModalOpen(true)}
                                        >
                                            <i className="ri-restaurant-line me-1"></i>
                                            Asignar Alimentación
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

            <BulkFeedingAssignmentModal
                isOpen={bulkFeedingModalOpen}
                onClose={() => setBulkFeedingModalOpen(false)}
                selectedLitters={selectedLitters}
                onSuccess={handleBulkFeedingSuccess}
            />

            <BulkWeanLittersModal
                isOpen={bulkWeanModalOpen}
                onClose={() => setBulkWeanModalOpen(false)}
                selectedLitters={selectedLitters}
                onSuccess={handleBulkWeanSuccess}
            />
        </div>
    )
}

export default ViewLitters;