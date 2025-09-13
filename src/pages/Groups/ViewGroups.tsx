import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Container } from "reactstrap";

const ViewGroups = () => {
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser()

    const fetchGroups = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_farm/${userLogged.farm_assigned}`)
        } catch (error) {
            console.error('error', { error })
        }
    }

    useEffect(() => {
        fetchGroups();
    }, [])

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Grupos"} pageTitle={"Grupos"} />

                <Card>
                    <CardHeader>
                        <Button className="" onClick={() => navigate('/groups/create_group')}>
                            <i className="ri-add-line me-2" />
                            Nuevo grupo
                        </Button>
                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={[]} data={[]} />
                    </CardBody>
                </Card>

            </Container>

        </div>
    )
}

export default ViewGroups;