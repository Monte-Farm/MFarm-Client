import App, { ConfigContext } from "App";
import React, { useContext } from "react";
import { Button, Card, CardBody, CardTitle, Container } from "reactstrap";

const Home = () => {
  document.title = "Inicio | Pig System";

  const data = useContext(ConfigContext)

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>

        </Container>
      </div>
    </React.Fragment>
  );
};

export default Home;
