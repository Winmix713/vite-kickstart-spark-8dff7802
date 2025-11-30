import React, { ReactNode } from "react";
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions
}) => {
  return <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gradient-emerald">{title}</h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>;
};
export default PageHeader;