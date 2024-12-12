import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { IncomeData } from "Components/Common/IncomeForm";
import ObjectDetails from "Components/Common/ObjectDetails";
import SupplierForm from "Components/Common/SupplierForm";
import { APIClient } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";

const supplierAttributes = [
    { key: 'id', label: 'Código' },
    { key: 'name', label: 'Nombre del proveedor' },
    { key: 'phone_number', label: 'Número telefónico' },
    { key: 'email', label: 'Correo electrónico' },
    { key: 'address', label: 'Dirección' },
    { key: 'supplier_type', label: 'Tipo de proveedor' },
    { key: 'rnc', label: 'RNC' },
    { key: 'status', label: 'Estado' }
];

export interface SupplierData {
    id: string;
    name: string;
    address: string;
    phone_number: string;
    email: string;
    supplier_type: string;
    status: boolean;
    rnc: string;
}

const incomesColumns = [
    { header: 'Identificador', accessor: 'id' },
    { header: 'Fecha de entrada', accessor: 'date' },
    { header: 'Proveedor', accessor: 'supplier' },
    { header: 'Precio Total', accessor: 'totalPrice' },
    { header: 'Tipo de entrada', accessor: 'incomeType' }
]

const SupplierDetails = () => {
    document.title = 'Supplier details | Suppliers';
    const apiUrl = process.env.REACT_APP_API_URL;
    const { id_supplier } = useParams();
    const axiosHelper = new APIClient();
    const history = useNavigate();

    const [supplierDetails, setSupplierDetails] = useState<SupplierData | undefined>(undefined);
    const [supplierIncomes, setSupplierIncomes] = useState([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ update: false, delete: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const handleGetSupplierDetails = async () => {
        try {
            const response = await axiosHelper.get(`${apiUrl}/supplier/find_supplier_id/${id_supplier}`);
            setSupplierDetails(response.data.data);
        } catch (error) {
            handleError(error, "Error al obtener detalles del proveedor.");
        } finally {
            setLoading(false);
        }
    };

    const handleGetIncomes = async () => {
        await axiosHelper.get(`${apiUrl}/incomes/find_incomes/supplier/${id_supplier}/true`)
            .then((response) => {
                setSupplierIncomes(response.data.data)
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde');
            })
    }

    const handleUpdateSupplier = async (supplierData: SupplierData) => {
        try {
            await axiosHelper.put(`${apiUrl}/supplier/update_supplier/${supplierData.id}`, supplierData);
            setAlertConfig({ visible: true, color: "success", message: "Proveedor actualizado correctamente." });
            setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
            toggleModal("update", false);
            handleGetSupplierDetails();
        } catch (error) {
            handleError(error, "Error al actualizar el proveedor.");
        }
    };

    const handleDeleteSupplier = async (supplierData: SupplierData) => {
        try {
            await axiosHelper.delete(`${apiUrl}/supplier/delete_supplier/${supplierData.id}`);
            setAlertConfig({ visible: true, color: "success", message: "Proveedor desactivado correctamente." });
            setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
            toggleModal("delete", false);
        } catch (error) {
            handleError(error, "Error al desactivar el proveedor.");
        }
    };

    const handleRowClicIncomeDetails = (row: any) => {
        history(`/warehouse/incomes/income_details/${row.id}`)
    }

    const handleBack = () => {
        if (window.history.length > 1) {
            history(-1);
        } else {
            history('/warehouse/suppliers/view_suppliers');
        }

    }

    useEffect(() => {
        handleGetSupplierDetails();
        handleGetIncomes();
    }, []);

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Supplier"} pageTitle={"Supplier Details"} />

                <div className="d-flex gap-2 mb-3 mt-3">
                    <Button className="me-auto" color="secondary" onClick={handleBack}>
                        <i className="ri-arrow-left-line me-3"></i>Regresar
                    </Button>
                    <Button color="danger" onClick={() => toggleModal("delete")} disabled={!supplierDetails?.status}>
                        <i className="ri-delete-bin-line me-3"></i>Desactivar Proveedor
                    </Button>
                    <Button color="success" onClick={() => toggleModal("update")}>
                        <i className="ri-pencil-line me-3"></i>Modificar Proveedor
                    </Button>
                    <Button color="secondary">
                        <i className="ri-mail-line me-3"></i>Enviar Email
                    </Button>
                </div>

                <Row className="d-flex" style={{alignItems: 'stretch'}}>
                    <Col lg={3} className="d-flex">
                        <Card className="rounded h-100">
                            <CardHeader><h4>Información del proveedor</h4></CardHeader>
                            <CardBody>
                                {supplierDetails && !loading ? (
                                    <ObjectDetails attributes={supplierAttributes} object={supplierDetails} showImage={false} />
                                ) : (
                                    <div className="position-relative top-50 start-50">
                                        <Spinner color="primary"></Spinner>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg={9} className="d-flex">
                        <Card className="h-100 w-100">
                            <CardHeader><h4>Historial de Altas | Compras</h4></CardHeader>
                            <CardBody>
                                {supplierIncomes && (
                                    <CustomTable columns={incomesColumns} data={supplierIncomes} showSearchAndFilter={false} rowClickable={true} onRowClick={handleRowClicIncomeDetails}/>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Modales */}
                <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("update")}>Modificar Proveedor</ModalHeader>
                    <ModalBody>
                        <SupplierForm initialData={supplierDetails} onSubmit={handleUpdateSupplier} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} />
                    </ModalBody>
                </Modal>

                <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("delete")}>Desactivar Proveedor</ModalHeader>
                    <ModalBody>¿Desea desactivar este proveedor?</ModalBody>
                    <ModalFooter>
                        <Button color="danger" onClick={() => toggleModal("delete", false)}>Cancelar</Button>
                        <Button color="success" onClick={() => handleDeleteSupplier(supplierDetails!)}>Confirmar</Button>
                    </ModalFooter>
                </Modal>

                {/* Alerta */}
                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}
            </Container>
        </div>
    );
};

export default SupplierDetails;
