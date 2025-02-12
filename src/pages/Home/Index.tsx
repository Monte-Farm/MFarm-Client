import App, { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import React, {useContext} from "react";
import { Button, Container } from "reactstrap";

const Home = () => {
  document.title = "Home | Mfarm";

  const data = useContext(ConfigContext)

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={"Inicio"} pageTitle={""} />
          
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Home;
