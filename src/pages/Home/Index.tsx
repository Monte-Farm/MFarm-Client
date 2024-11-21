import BreadCrumb from "Components/Common/BreadCrumb";
import React from "react";
import { Button, Container } from "reactstrap";

const Home = () => {
  document.title = "Home | Mfarm";


  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={"Home"} pageTitle={""} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Home;
