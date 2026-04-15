import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { SupplierData } from "common/data_interfaces";
import { ConfigContext } from "App";
import { getSupplierTypeOptions } from "common/enums/suppliers.enums";

interface SupplierFormProps {
  initialData?: SupplierData;
  onSubmit: (data: SupplierData) => Promise<void>;
  onCancel: () => void;
  isCodeDisabled?: boolean
}

const SupplierForm: React.FC<SupplierFormProps> = ({ initialData, onSubmit, onCancel, isCodeDisabled }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const configContext = useContext(ConfigContext)

  const validationSchema = Yup.object({
    id: Yup.string()
      .required("Por favor, ingrese el código")
      .test('unique_id', 'Este identificador ya existe, por favor ingrese otro', async (value) => {
        if (initialData) return true
        if (!value) return false
        try {
          const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/supplier/supplier_id_exists/${value}`)
          return !result?.data.data
        } catch (error) {
          console.error(`Error al validar el ID: ${error}`)
          return false
        }
      }),
    name: Yup.string().required("Por favor, ingrese el nombre"),
    address: Yup.string().required("Por favor, ingrese la dirección"),
    phone_number: Yup.string().required("Por favor, ingrese el número de teléfono"),
    email: Yup.string().email("Ingrese un correo válido").required("Por favor, ingrese el correo electrónico"),
    supplier_type: Yup.string().required("Por favor, seleccione el tipo de proveedor"),
    rnc: Yup.string().required("Por favor, ingrese el RNC"),
  });


  const formik = useFormik({
    initialValues: initialData || {
      id: "",
      name: "",
      address: "",
      phone_number: "",
      email: "",
      supplier_type: "",
      status: true,
      rnc: "",
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        await onSubmit(values);
      } catch (error) {
        console.error("Error al enviar el formulario:", error);
        setShowErrorAlert(true);
      } finally {
        setSubmitting(false);
        setTimeout(() => setShowErrorAlert(false), 5000);
      }
    },
  });

  const fetchNextId = async () => {
    if (!configContext || initialData) return;

    try {
      const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/supplier/supplier_next_id`);
      formik.setFieldValue('id', response.data.data);
    } catch (error) {
      console.error('Ha ocurrido un error al obtener el id');
    }
  };


  useEffect(() => {
    fetchNextId();
  }, [])

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          formik.handleSubmit();
        }}
      >
        {/* Identificación */}
        <div className="mb-4">
          <div className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>
            Identificación
          </div>

          <Row className="g-3">
            <Col lg={4}>
              <Label htmlFor="idInput" className="form-label">Código</Label>
              <Input
                type="text"
                id="idInput"
                name="id"
                value={formik.values.id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.id && !!formik.errors.id}
                disabled={isCodeDisabled}
              />
              {formik.touched.id && formik.errors.id && <FormFeedback>{formik.errors.id}</FormFeedback>}
            </Col>

            <Col lg={8}>
              <Label htmlFor="nameInput" className="form-label">Nombre del Proveedor</Label>
              <Input
                type="text"
                id="nameInput"
                name="name"
                placeholder="Ej. Distribuidora XYZ"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.name && !!formik.errors.name}
              />
              {formik.touched.name && formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
            </Col>

            <Col lg={12}>
              <Label htmlFor="supplierTypeInput" className="form-label">Tipo de Proveedor</Label>
              <Input
                type="select"
                id="supplierTypeInput"
                name="supplier_type"
                value={formik.values.supplier_type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.supplier_type && !!formik.errors.supplier_type}
              >
                <option value="">Seleccione un tipo</option>
                {getSupplierTypeOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Input>
              {formik.touched.supplier_type && formik.errors.supplier_type && (
                <FormFeedback>{formik.errors.supplier_type}</FormFeedback>
              )}
            </Col>
          </Row>
        </div>

        {/* Contacto */}
        <div className="mb-4">
          <div className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>
            Contacto
          </div>

          <Row className="g-3">
            <Col lg={6}>
              <Label htmlFor="phone_numberInput" className="form-label">Teléfono</Label>
              <Input
                type="text"
                id="phone_numberInput"
                name="phone_number"
                placeholder="Ej. 809-555-0000"
                value={formik.values.phone_number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.phone_number && !!formik.errors.phone_number}
              />
              {formik.touched.phone_number && formik.errors.phone_number && <FormFeedback>{formik.errors.phone_number}</FormFeedback>}
            </Col>

            <Col lg={6}>
              <Label htmlFor="emailInput" className="form-label">Correo Electrónico</Label>
              <Input
                type="email"
                id="emailInput"
                name="email"
                placeholder="contacto@proveedor.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.email && !!formik.errors.email}
              />
              {formik.touched.email && formik.errors.email && <FormFeedback>{formik.errors.email}</FormFeedback>}
            </Col>

            <Col lg={12}>
              <Label htmlFor="addressInput" className="form-label">Dirección</Label>
              <Input
                type="text"
                id="addressInput"
                name="address"
                placeholder="Ingrese la dirección completa"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.address && !!formik.errors.address}
              />
              {formik.touched.address && formik.errors.address && <FormFeedback>{formik.errors.address}</FormFeedback>}
            </Col>
          </Row>
        </div>

        {/* Información Fiscal */}
        <div className="mb-4">
          <div className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>
            Información Fiscal
          </div>

          <Row className="g-3">
            <Col lg={12}>
              <Label htmlFor="rncInput" className="form-label">ID Fiscal (RNC)</Label>
              <Input
                type="text"
                id="rncInput"
                name="rnc"
                placeholder="Ingrese el ID Fiscal"
                value={formik.values.rnc}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={formik.touched.rnc && !!formik.errors.rnc}
                disabled={isCodeDisabled}
              />
              {formik.touched.rnc && formik.errors.rnc && <FormFeedback>{formik.errors.rnc}</FormFeedback>}
            </Col>
          </Row>
        </div>

        {/* ============ BOTONES ============ */}
        <div className="d-flex justify-content-end mt-4 pt-3 gap-2 border-top">
          <Button className="farm-secondary-button" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
            Cancelar
          </Button>
          <Button className="farm-primary-button" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? "Guardando..." : initialData ? "Actualizar Proveedor" : "Registrar Proveedor"}
          </Button>
        </div>
      </form>

      {/* Modal de Confirmación de Cancelación */}
      <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
        <ModalHeader>Confirmación de Cancelación</ModalHeader>
        <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={onCancel}>Sí, cancelar</Button>
          <Button color="success" onClick={() => setCancelModalOpen(false)}>No, continuar</Button>
        </ModalFooter>
      </Modal>

      {/* Alerta de Error */}
      {showErrorAlert && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x bg-danger text-white text-center p-3 rounded" style={{ zIndex: 1050, width: "90%", maxWidth: "500px" }}>
          <span>El servicio no está disponible. Inténtelo de nuevo más tarde.</span>
        </div>
      )}
    </>
  );
};

export default SupplierForm;
