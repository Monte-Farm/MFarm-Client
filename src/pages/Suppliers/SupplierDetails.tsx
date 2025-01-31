import { SupplierData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import ObjectDetails from "Components/Common/ObjectDetails";
import SupplierForm from "Components/Common/SupplierForm";
import { APIClient } from "helpers/api_helper";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";

const supplierAttributes = [
    { key: 'id', label: 'Identificador' },
    { key: 'name', label: 'Nombre' },
    { key: 'phone_number', label: 'Teléfono' },
    { key: 'email', label: 'Correo' },
    { key: 'address', label: 'Dirección' },
    { key: 'supplier_type', label: 'Categoría' },
    { key: 'rnc', label: 'RNC' },
    { key: 'status', label: 'Estado' }
];

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

    const incomesColumns = [
        { header: 'Identificador', accessor: 'id', isFilterable: true },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true },
        { header: 'Precio Total', accessor: 'totalPrice' },
        { header: 'Tipo de entrada', accessor: 'incomeType', isFilterable: true, options: [{ label: 'Compra', value: 'Compra' }] },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
              <div className="d-flex gap-1">
                <Button className="btn-secondary btn-icon" onClick={() => handleIncomeDetails(row)}>
                  <i className="ri-eye-fill align-middle"></i>
                </Button>
              </div>
            ),
          },
    ]

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
        await axiosHelper.get(`${apiUrl}/incomes/find_incomes/origin.id/${id_supplier}/true`)
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

    const handleIncomeDetails = (row: any) => {
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

                <Row className="d-flex" style={{ alignItems: 'stretch', height: '75vh' }}>
                    <Col lg={3}>
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
                    <Col lg={9}>
                        <Card className="h-100 w-100">
                            <CardHeader><h4>Historial de Altas | Compras</h4></CardHeader>
                            <CardBody>
                                {supplierIncomes && (
                                    <CustomTable columns={incomesColumns} data={supplierIncomes} showSearchAndFilter={true} rowClickable={false} rowsPerPage={15} />
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
