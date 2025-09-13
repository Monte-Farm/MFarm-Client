import BreadCrumb from "Components/Common/BreadCrumb";
import { Container } from "reactstrap";

const ViewLaboratory = () => {

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Laboratorio"} pageTitle={"Reproducción"} />
            </Container>
        </div>
    )
}

export default ViewLaboratory;

