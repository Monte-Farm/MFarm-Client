import BreadCrumb from "Components/Common/BreadCrumb"
import IncomeForm, { IncomeData } from "Components/Common/IncomeForm"
import { Card, CardBody, Container } from "reactstrap"



const CreatIncome = () => {
    document.title = 'New Income | Warehose'


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"New Income"} pageTitle={"Incomes"} />

                <Card className="rounded">
                    <CardBody>
                        <IncomeForm onSubmit={function (data: IncomeData): Promise<void> {
                            throw new Error("Function not implemented.")
                        }} onCancel={function (): void {
                            throw new Error("Function not implemented.")
                        }}></IncomeForm>
                    </CardBody>
                </Card>

            </Container>




        </div>
    )
}

export default CreatIncome