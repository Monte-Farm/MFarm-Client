import BreadCrumb from "Components/Common/BreadCrumb"
import SupplierForm, { SupplierData } from "Components/Common/SupplierForm"
import { APIClient } from "helpers/api_helper"
import { useNavigate } from "react-router-dom"
import { Card, CardBody, CardHeader, Container } from "reactstrap"


const CreateSupplier = () => {
    document.title = 'New Supplier | Warehouse'
    const history = useNavigate();
    const axiosHelper = new APIClient();
    const apiUrl = process.env.REACT_APP_API_URL;


    //Agregar manejo de errores
    const handleCreateSupplier = async (data: any) => {
        await axiosHelper.create(`${apiUrl}/supplier/create_supplier`, data)
    }

    const handleCancel = () =>{
        history('/warehouse/suppliers/view_suppliers')
    }

    return(
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"New Supplier"} pageTitle={"Suppliers"}/>

                <Card className="rounded">
                    <CardHeader>
                        <h5>Registrar Nuevo Proveedor</h5>
                    </CardHeader>
                    <CardBody>
                        <SupplierForm onSubmit={handleCreateSupplier} onCancel={handleCancel}/>
                    </CardBody>
                </Card>
            </Container>
        </div>
    )
}


export default CreateSupplier