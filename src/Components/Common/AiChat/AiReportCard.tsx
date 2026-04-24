import React from 'react';
import { AiReport } from 'slices/ai/reducer';

interface AiReportCardProps {
    report: AiReport;
}

const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const AiReportCard: React.FC<AiReportCardProps> = ({ report }) => {
    const expiresAt = new Date(report.expiresAt);
    const isExpired = !isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now();
    const expiresLabel = isNaN(expiresAt.getTime()) ? '' : expiresAt.toLocaleString();

    return (
        <div className="ai-report-card">
            <div className="ai-report-card__icon">
                <i className="ri-file-pdf-2-line"></i>
            </div>
            <div className="ai-report-card__body">
                <div className="ai-report-card__filename" title={report.filename}>
                    {report.filename}
                </div>
                <div className="ai-report-card__meta">
                    PDF · {formatSize(report.bytes)}
                    {expiresLabel && (
                        <>
                            {' · '}
                            {isExpired ? 'Enlace expirado' : `Expira ${expiresLabel}`}
                        </>
                    )}
                </div>
            </div>
            {isExpired ? (
                <span className="ai-report-card__expired">
                    <i className="ri-error-warning-line"></i>
                </span>
            ) : (
                <a
                    className="btn btn-primary btn-sm ai-report-card__download"
                    href={report.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={report.filename}
                >
                    <i className="ri-download-line me-1"></i>
                    Descargar
                </a>
            )}
        </div>
    );
};

export default React.memo(AiReportCard, (prev, next) => prev.report === next.report);
