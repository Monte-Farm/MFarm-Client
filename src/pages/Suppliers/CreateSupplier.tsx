import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/BreadCrumb"
import SupplierForm from "Components/Common/SupplierForm"
import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Card, CardBody, CardHeader, Container } from "reactstrap"


const CreateSupplier = () => {
    document.title = 'New Supplier | Warehouse'
    const history = useNavigate();
    const configContext = useContext(ConfigContext);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

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


    const handleCreateSupplier = async (data: any) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/supplier/create_supplier`, data);
            showAlert('success', 'El proveedor se ha creado con éxito');
            setTimeout(() => handleCancel(), 5000);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        }
    };


    const handleCancel = () => {
        history('/warehouse/suppliers/view_suppliers')
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"New Supplier"} pageTitle={"Suppliers"} />

                <Card className="rounded">
                    <CardHeader>
                        <h5>Registrar Nuevo Proveedor</h5>
                    </CardHeader>
                    <CardBody>
                        <SupplierForm onSubmit={handleCreateSupplier} onCancel={handleCancel} />
                    </CardBody>
                </Card>

                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}

            </Container>
        </div>
    )
}


export default CreateSupplier