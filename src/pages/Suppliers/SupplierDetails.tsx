import { ConfigContext } from "App";
import { Attribute, SupplierData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import ObjectDetailsHorizontal from "Components/Common/Details/ObjectDetailsHorizontal";
import SupplierForm from "Components/Common/Forms/SupplierForm";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";

const supplierAttributes: Attribute[] = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'phone_number', label: 'Teléfono', type: 'text' },
    { key: 'email', label: 'Correo', type: 'text' },
    { key: 'address', label: 'Dirección', type: 'text' },
    { key: 'supplier_type', label: 'Categoría', type: 'text' },
    { key: 'rnc', label: 'RNC', type: 'text' },
    { key: 'status', label: 'Estado', type: 'status' }
];

const SupplierDetails = () => {
    document.title = 'Detalles de Proveedor | Proveedores';
    const { id_supplier } = useParams();
    const history = useNavigate();
    const configContext = useContext(ConfigContext)

    const [supplierDetails, setSupplierDetails] = useState<SupplierData | undefined>(undefined);
    const [supplierIncomes, setSupplierIncomes] = useState([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ update: false, delete: false });

    const incomesColumns: Column<any>[] = [
        { header: 'Identificador', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true, type: 'text' },
        { header: 'Precio Total', accessor: 'totalPrice', type: 'currency' },
        { header: 'Tipo de entrada', accessor: 'incomeType', isFilterable: true, type: 'text' },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleIncomeDetails(row)}>
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

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }


    const handleGetSupplierDetails = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/supplier/find_supplier_id/${id_supplier}`);
            setSupplierDetails(response.data.data);
        } catch (error) {
            handleError(error, "Error al obtener detalles del proveedor.");
        }
    };


    const handleGetIncomes = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_incomes/origin.id/${id_supplier}/true`);
            setSupplierIncomes(response.data.data);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };


    const handleUpdateSupplier = async (supplierData: SupplierData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/update_supplier/${supplierData.id}`, supplierData);
            showAlert('success', 'El proveedor ha sido actualizado con éxito');
            handleGetSupplierDetails();
        } catch (error) {
            handleError(error, "Error al actualizar el proveedor.");
        } finally {
            toggleModal("update", false);
        }
    };


    const handleDeleteSupplier = async (supplierData: SupplierData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/supplier/delete_supplier/${supplierData.id}`);
            showAlert('success', 'El proveedor ha sido desactivado con éxito')
            handleGetSupplierDetails();
        } catch (error) {
            handleError(error, "Error al desactivar el proveedor.");
        } finally {
            toggleModal("delete", false);
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
        const fetchData = async () => {
            await Promise.all([
                handleGetSupplierDetails(),
                handleGetIncomes(),
            ])

            setLoading(false);
        }

        fetchData();
    }, []);


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
                <BreadCrumb title={"Detalles de Proveedor"} pageTitle={"Proveedor"} />

                <div className="d-flex gap-2 mb-3">
                    <Button className="me-auto farm-primary-button" onClick={handleBack}>
                        <i className="ri-arrow-left-line me-3"></i>Regresar
                    </Button>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("delete")} disabled={!supplierDetails?.status}>
                        <i className="ri-delete-bin-line me-3"></i>Desactivar Proveedor
                    </Button>
                    <Button className="farm-primary-button" onClick={() => toggleModal("update")}>
                        <i className="ri-pencil-line me-3"></i>Modificar Proveedor
                    </Button>
                    <Button className="farm-primary-button" onClick={() => window.open('https://workspace.google.com/intl/es-419_mx/gmail/', '_blank', 'noopener,noreferrer')}>
                        <i className="ri-mail-line me-3"></i>Enviar Email
                    </Button>

                </div>

                <div className="d-flex-column gap-3">

                    <Card className="rounded h-100">
                        <CardHeader><h4>Información del proveedor</h4></CardHeader>
                        <CardBody>
                            <ObjectDetailsHorizontal attributes={supplierAttributes} object={supplierDetails || {}} />
                        </CardBody>
                    </Card>


                    <Card className="h-100 w-100">
                        <CardHeader><h4>Historial de Altas | Compras</h4></CardHeader>
                        <CardBody>
                            {supplierIncomes && (
                                <CustomTable columns={incomesColumns} data={supplierIncomes} showSearchAndFilter={true} rowClickable={false} rowsPerPage={7} showPagination={false} />
                            )}
                        </CardBody>
                    </Card>
                </div>
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
