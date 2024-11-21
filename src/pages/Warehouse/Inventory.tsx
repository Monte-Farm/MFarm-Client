import BreadCrumb from "Components/Common/BreadCrumb";
import React from "react";
import { Button, Container } from "reactstrap";

const ViewInventory = () => {
  document.title = "View Inventory | Warehouse";


  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={"Warehouse"} pageTitle={"View Inventory"} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default ViewInventory;
