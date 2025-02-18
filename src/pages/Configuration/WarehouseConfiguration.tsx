import { ConfigContext } from "App";
import { ConfigurationData } from "common/data_interfaces";
import StringTable from "Components/Common/StringTable";
import { useContext, useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Container } from "reactstrap";

const WarehouseConfiguration = () => {
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const configContext = useContext(ConfigContext)

    const [configuration, setConfiguration] = useState<ConfigurationData | null>(null);

    const handleError = (error: any, messagge: string) => {
        console.error(error, messagge)
        setAlertConfig({ visible: true, color: 'danger', message: messagge })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const handleFetchConfiguration = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/configurations/get_configurations`);
            setConfiguration(response.data.data);

        } catch (error) {
            handleError(error, 'Ha ocurrido un error al recuperar las configuraciones, intentelo más tarde');
        }
    };

    useEffect(() => {
        if (!configContext) return;

        handleFetchConfiguration();
    }, [configContext?.configurationData])

    return (
        <div className="page-content">
            <Container fluid>


                <Card className="border">
                    <CardHeader>
                        <h5>Tipos de entradas</h5>
                    </CardHeader>
                    <CardBody>
                        <StringTable name="incomeTypes" values={configuration?.incomeTypes || []} onChange={function (name: string, newValues: string[]): void {
                            throw new Error("Function not implemented.");
                        }}
                        />
                    </CardBody>
                </Card>

                <Card className="border">
                    <CardHeader>
                        <h5>Tipo de salidas</h5>
                    </CardHeader>
                    <CardBody>
                        <StringTable name="outcomeTypes" values={configuration?.outcomeTypes || []} onChange={function (name: string, newValues: string[]): void {
                            throw new Error("Function not implemented.");
                        }}
                        />
                    </CardBody>
                </Card>

                <Card className="border">
                    <CardHeader>
                        <h5>Unidades de medida</h5>
                    </CardHeader>
                    <CardBody>
                        <StringTable name="outcomeTypes" values={configuration?.unitMeasurements || []} onChange={function (name: string, newValues: string[]): void {
                            throw new Error("Function not implemented.");
                        }}
                        />
                    </CardBody>
                </Card>
            </Container>
        </div>
    )
}

export default WarehouseConfiguration;