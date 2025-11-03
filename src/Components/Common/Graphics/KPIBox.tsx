import React from 'react';
import { Card, CardBody, CardTitle } from 'reactstrap';

interface KPIBoxProps {
  label: string;
  value: React.ReactNode; // Permite strings, numbers, JSX, etc.
  icon?: React.ReactNode; // Icono opcional (ej: FontAwesome, react-icons)
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  cardStyle?: React.CSSProperties;
  onClick?: () => void;
}

const KPIBox: React.FC<KPIBoxProps> = ({
  label,
  value,
  icon,
  className = '',
  valueClassName = '',
  labelClassName = '',
  cardStyle = {},
  onClick
}) => {
  return (
    <Card 
      className={`mb-2 flex-fill ${className}`}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        minWidth: '120px',
        ...cardStyle 
      }}
      onClick={onClick}
    >
      <CardBody className="text-center p-2 p-md-3">
        <div className="d-flex align-items-center justify-content-center gap-2">
          {icon && <div className="kpi-icon">{icon}</div>}
          <div>
            <CardTitle 
              tag="h6" 
              className={`text-muted mb-1 ${labelClassName}`}
            >
              {label}
            </CardTitle>
            <h5 className={`fw-bold m-0 ${valueClassName}`}>
              {value}
            </h5>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default KPIBox;