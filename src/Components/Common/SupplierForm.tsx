import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Row, Modal, ModalHeader, ModalBody, ModalFooter, Label, Input, FormFeedback } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { APIClient } from "helpers/api_helper";
import { SupplierData } from "common/data_interfaces";
import { ConfigContext } from "App";

const axiosHelper = new APIClient();
const apiUrl = process.env.REACT_APP_API_URL;

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
          const result = await axiosHelper.get(`${apiUrl}/supplier/supplier_id_exists/${value}`)
          return !result.data.data
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
    await axiosHelper.get(`${apiUrl}/supplier/supplier_next_id`)
      .then((response) => {
        const nextId = response.data.data;
        formik.setFieldValue('id', nextId)
      })
      .catch((error) => {
        console.error('Ha ocurrido un error al obtener el id')
      })
  }

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
        {/* Código */}
        <div className="mt-4">
          <Label htmlFor="idInput" className="form-label">Código</Label>
          <Input
            type="text"
            id="idInput"
            className="form-control"
            name="id"
            value={formik.values.id}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.id && !!formik.errors.id}
            disabled={isCodeDisabled}
          />
          {formik.touched.id && formik.errors.id && <FormFeedback>{formik.errors.id}</FormFeedback>}
        </div>

        {/* Nombre */}
        <div className="mt-4">
          <Label htmlFor="nameInput" className="form-label">Nombre</Label>
          <Input
            type="text"
            id="nameInput"
            className="form-control"
            name="name"
            placeholder="Ingrese el nombre del proveedor"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.name && !!formik.errors.name}
          />
          {formik.touched.name && formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
        </div>

        <Row className="mt-4">
          {/* Dirección */}
          <Col lg={6}>
            <Label htmlFor="addressInput" className="form-label">Dirección</Label>
            <Input
              type="text"
              id="addressInput"
              className="form-control"
              name="address"
              placeholder="Ingrese la dirección"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={formik.touched.address && !!formik.errors.address}
            />
            {formik.touched.address && formik.errors.address && <FormFeedback>{formik.errors.address}</FormFeedback>}
          </Col>

          {/* Número de Teléfono */}
          <Col lg={6}>
            <Label htmlFor="phone_numberInput" className="form-label">Número Telefonico</Label>
            <Input
              type="text"
              id="phone_numberInput"
              name="phone_number"
              value={formik.values.phone_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={formik.touched.phone_number && !!formik.errors.phone_number} />
            {formik.touched.phone_number && formik.errors.phone_number && <FormFeedback>{formik.errors.phone_number}</FormFeedback>}
          </Col>
        </Row>

        <Row className="mt-4">
          {/* Correo Electrónico */}
          <Col lg={6}>
            <Label htmlFor="emailInput" className="form-label">Correo Electrónico</Label>
            <Input
              type="email"
              id="emailInput"
              className="form-control"
              name="email"
              placeholder="Ingrese el correo electrónico"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              invalid={formik.touched.email && !!formik.errors.email}
            />
            {formik.touched.email && formik.errors.email && <FormFeedback>{formik.errors.email}</FormFeedback>}
          </Col>

          {/* Tipo de Proveedor */}
          <Col lg={6}>
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
              {configContext?.configurationData?.categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Input>
            {formik.touched.supplier_type && formik.errors.supplier_type && <FormFeedback>{formik.errors.supplier_type}</FormFeedback>}
          </Col>
        </Row>

        {/* RNC */}
        <div className="mt-4">
          <Label htmlFor="rncInput" className="form-label">RNC</Label>
          <Input
            type="text"
            id="rncInput"
            className="form-control"
            name="rnc"
            placeholder="Ingrese el RNC"
            value={formik.values.rnc}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.rnc && !!formik.errors.rnc}
          />
          {formik.touched.rnc && formik.errors.rnc && <FormFeedback>{formik.errors.rnc}</FormFeedback>}
        </div>

        {/* Botones */}
        <div className="d-flex justify-content-end mt-4 gap-2">
          <Button color="danger" onClick={() => setCancelModalOpen(true)} disabled={formik.isSubmitting}>
            Cancelar
          </Button>
          <Button color="success" type="submit" disabled={formik.isSubmitting}>
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
