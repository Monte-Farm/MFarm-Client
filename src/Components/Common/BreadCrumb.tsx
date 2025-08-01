import React from 'react';
import { Link } from 'react-router-dom';
import { Col, Row } from 'reactstrap';

interface BreadCrumbProps {
    title: string;
    pageTitle : string;
}

const BreadCrumb = ({ title, pageTitle } : BreadCrumbProps) => {
    return (
        <React.Fragment>
            <Row>
                <Col xs={12}>
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 fs-5">{title}</h4>

                        <div className="page-title-right fs-5">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><Link to="#">{pageTitle}</Link></li>
                                <li className="breadcrumb-item active">{title}</li>
                            </ol>
                        </div>

                    </div>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default BreadCrumb;