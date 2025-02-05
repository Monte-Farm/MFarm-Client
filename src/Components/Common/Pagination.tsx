import React, { useEffect } from "react";
import { Row } from "reactstrap";

interface PaginationProps {
  data: any[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  perPageData: number;
  prevText?: string;
  nextText?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  data,
  currentPage,
  setCurrentPage,
  perPageData,
  prevText = "Atras",
  nextText = "Siguiente",
}) => {
  const totalPages = Math.ceil(data.length / perPageData);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  return (
    <Row className="g-0 justify-content-center mb-4">
      <div className="col-sm-auto">
        <ul className="pagination-block pagination pagination-separated justify-content-center justify-content-sm-end mb-sm-0">
          {/* Botón "Previous" */}
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              {prevText}
            </button>
          </li>

          {/* Números de página */}
          {pageNumbers.map((num) => (
            <li key={num} className={`page-item ${currentPage === num ? "active" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(num)}
              >
                {num}
              </button>
            </li>
          ))}

          {/* Botón "Next" */}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              {nextText}
            </button>
          </li>
        </ul>
      </div>
    </Row>
  );
};

export default Pagination;
