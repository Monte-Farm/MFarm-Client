import BreadCrumb from "Components/Common/BreadCrumb";
import { Card, CardBody, Col, Container, ListGroup, ListGroupItem, Row, Spinner } from "reactstrap"
import { useEffect, useState } from "react";
import SystemConfiguration from "Components/Common/SystemConfiguration";

const ConfigurationPage = () => {
    document.title = 'Configuración | Pig System';

    const [activeListItem, setActiveListItem] = useState<number | null>(null);
    const [selectedComponent, setSelectedComponent] = useState<React.ReactElement | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const listItems = [
        { id: 1, name: 'Sistema', component: <SystemConfiguration /> },
    ]

    const handleItemClick = (item: any) => {
        setActiveListItem(item.id)
        setSelectedComponent(item.component)
    }

    useEffect(() => {
        if (listItems.length > 0) {
            setActiveListItem(listItems[0].id);
            setSelectedComponent(listItems[0].component);
        }
    }, []);


    if (loading) {
        return (
            <div className="page-content">
                <Spinner className="position-absolute top-50 start-50" />
            </div>
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Configuración"} pageTitle={"Sistema"} />

                <Row className="h-100">
                    <Col lg={3}>

                        <ListGroup className="list-group-fill-success">
                            {listItems.map((item) => (
                                <ListGroupItem
                                    key={item.id}
                                    tag='a'
                                    href="#"
                                    className={activeListItem === item.id ? "list-group-item-action active" : 'list-group-item-action'}
                                    onClick={() => handleItemClick(item)}
                                >{item.name}</ListGroupItem>
                            ))}
                        </ListGroup>
                    </Col>

                    <Col lg={9}>
                        <Card>
                            <CardBody>
                                {selectedComponent ? selectedComponent : null}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

            </Container>

        </div>
    )
}

export default ConfigurationPage