import React, { useEffect } from "react";
import { Button } from "reactstrap";

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
  prevText = "Anterior",
  nextText = "Siguiente",
}) => {
  const totalPages = Math.ceil(data.length / perPageData);
  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;

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
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage, setCurrentPage]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-top">
      <div className="text-muted small">
        Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, data.length)} de {data.length}
      </div>
      <div className="d-flex gap-2 align-items-center">
        <Button
          size="sm"
          color="secondary"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <i className="ri-arrow-left-s-line me-1" />
          {prevText}
        </Button>
        <span className="text-muted small">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          size="sm"
          color="secondary"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          {nextText}
          <i className="ri-arrow-right-s-line ms-1" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
