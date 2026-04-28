import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  prevText,
  nextText,
}) => {
  const { t } = useTranslation();
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
        {t("shared.pagination.showing", {
          from: indexOfFirstItem + 1,
          to: Math.min(indexOfLastItem, data.length),
          total: data.length,
        })}
      </div>
      <div className="d-flex gap-2 align-items-center">
        <Button
          size="sm"
          color="secondary"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <i className="ri-arrow-left-s-line me-1" />
          {prevText ?? t("shared.pagination.prev")}
        </Button>
        <span className="text-muted small">
          {t("shared.pagination.page", { current: currentPage, total: totalPages })}
        </span>
        <Button
          size="sm"
          color="secondary"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          {nextText ?? t("shared.pagination.next")}
          <i className="ri-arrow-right-s-line ms-1" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
