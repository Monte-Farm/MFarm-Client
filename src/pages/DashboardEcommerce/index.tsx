import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useProfile } from "Components/Hooks/UserHooks";
import { APIClient, getLoggedinUser } from "helpers/api_helper";
import React from "react";
import { Button, Container } from "reactstrap";

const DashboardEcommerce = () => {
  document.title = "Dashboard | Velzon - React Admin & Dashboard Template";


  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={"Ecommerce"} pageTitle={"Dashboard"} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardEcommerce;
