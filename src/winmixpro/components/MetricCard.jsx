import React from 'react';
import classNames from 'classnames';

const intentClasses = {
  positive: "text-emerald-300",
  warning: "text-amber-300",
  neutral: "text-slate-200",
};

const MetricCard = ({ label, value, hint, trend, intent = "neutral", icon: Icon }) => (
  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/20 via-white/5 to-transparent p-5 shadow-lg transition duration-300 hover:border-white/30 hover:bg-white/10">
    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/60">
      <span>{label}</span>
      {Icon && <Icon className="h-4 w-4 text-white/60" />}
    </div>
    <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
      {value}
    </div>
    <div className="mt-2 flex items-center justify-between text-xs text-white/60">
      <span>{hint || '\u00A0'}</span>
      {trend && (
        <span className={classNames("font-semibold", intentClasses[intent])}>{trend}</span>
      )}
    </div>
  </div>
);

export default MetricCard;
