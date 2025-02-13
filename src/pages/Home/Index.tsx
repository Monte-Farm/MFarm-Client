import App, { ConfigContext } from "App";
import AreaChart from "Components/Common/AreaChart";
import BarChart from "Components/Common/BarChart";
import BreadCrumb from "Components/Common/BreadCrumb";
import LineChart from "Components/Common/LineChart";
import PieChart from "Components/Common/PieChart";
import React, { useContext } from "react";
import { Button, Card, CardBody, CardTitle, Container } from "reactstrap";

const Home = () => {
  document.title = "Home | Mfarm";

  const data = useContext(ConfigContext)

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={"Inicio"} pageTitle={""} />
          <div className="d-flex-column gap-3">

            <div className="d-flex gap-3">
              <Card className="w-50 h-100">
                <CardBody>
                  <CardTitle tag="h5">Ventas Mensuales (Línea)</CardTitle>
                  <LineChart
                    series={[{ name: 'Ventas', data: [10, 20, 30, 40, 50] }]}
                    categories={['Ene', 'Feb', 'Mar', 'Abr', 'May']}
                    title="Ventas Mensuales"
                  />
                </CardBody>
              </Card>

              <Card className="w-50 h-100">
                <CardBody>
                  <CardTitle tag="h5">Crecimiento de Usuarios (Área)</CardTitle>
                  <AreaChart
                    series={[{ name: 'Usuarios', data: [20, 40, 60, 80, 100] }]}
                    categories={['2016', '2017', '2018', '2019', '2020']}
                    title="Usuarios por Año"
                  />
                </CardBody>
              </Card>
            </div>

            <div className="d-flex gap-3">

              <Card className="w-25 h-100">
                <CardBody>
                  <CardTitle tag="h5">Distribución de Ventas (Pastel)</CardTitle>
                  <PieChart
                    series={[44, 55, 13, 43]}
                    labels={['Producto A', 'Producto B', 'Producto C', 'Producto D']}
                    title="Ventas por Producto"
                  />
                </CardBody>
              </Card>

              <Card className="w-25 h-100">
                <CardBody>
                  <CardTitle tag="h5">Crecimiento de Usuarios (Área)</CardTitle>
                  <AreaChart
                    series={[{ name: 'Usuarios', data: [20, 40, 60, 80, 100] }]}
                    categories={['2016', '2017', '2018', '2019', '2020']}
                    title="Usuarios por Año"
                  />
                </CardBody>
              </Card>

              <Card className="w-25 h-100">
                <CardBody>
                  <CardTitle tag="h5">Ingresos Trimestrales (Línea sin zoom)</CardTitle>
                  <LineChart
                    series={[{ name: 'Ingresos', data: [100, 200, 150, 300, 250] }]}
                    categories={['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo']}
                    title="Ingresos Trimestrales"
                    zoomEnabled={false}
                  />
                </CardBody>
              </Card>

              <Card className="w-25 h-100">
                <CardBody>
                  <CardTitle tag="h5">Ventas Mensuales (Barras)</CardTitle>
                  <BarChart
                    series={[{ name: "Ventas", data: [500, 700, 800, 1000, 600, 900] }]}
                    categories={["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"]}
                    title="Ventas por Mes"
                  />
                </CardBody>
              </Card>

            </div>

            <div className="d-flex gap-3">
              <Card className="h-100 w-100">
                <CardBody>
                  <CardTitle tag="h5">Ventas Semanales (Barras)</CardTitle>
                  <BarChart
                    series={[{ name: 'Ventas', data: [20, 35, 40, 55, 60] }]}
                    categories={['Lun', 'Mar', 'Mié', 'Jue', 'Vie']}
                    title="Ventas Semanales"
                  />
                </CardBody>
              </Card>
            </div>

          </div>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Home;
