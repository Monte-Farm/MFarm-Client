import BreadCrumb from "Components/Common/BreadCrumb";
import ProductForm from "Components/Common/ProductForm";
import { APIClient } from "helpers/api_helper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Container } from "reactstrap";



const CreateProduct = () => {
    document.title = 'Create Product | Inventory';
    const apiUrl = process.env.REACT_APP_API_URL;
    const axiosHelper = new APIClient();
    const history = useNavigate();


    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const handleAddProduct = async (data: any) => {
        await axiosHelper.create(`${apiUrl}/product/create_product`, data)
            .then((response) => {

            })
            .catch((error) => {

            })
    };

    const handleCancel = () => {
        history('/warehouse/inventory/view_inventory')
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Create Product"} pageTitle={"Inventory"} />

                <Card>
                    <CardHeader>
                        <h4>Nuevo Producto</h4>
                    </CardHeader>
                    <CardBody>
                        <ProductForm onSubmit={handleAddProduct} onCancel={handleCancel} />
                    </CardBody>
                </Card>
            </Container>

        </div>
    )
}

export default CreateProduct