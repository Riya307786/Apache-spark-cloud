import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-brand-surface border border-brand-light/30 rounded-xl px-4 py-3 flex items-start gap-3 shadow-xs">
      <AlertCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
      <div className="text-xs text-text-primary leading-relaxed">
        <span className="font-semibold text-brand mr-1.5">RESEARCH ESTIMATE ONLY:</span>
        This analytical system is developed for population-level research and exploratory risk stratification. It does not provide medical diagnoses or prescribe clinical interventions. Model predictions must not replace professional clinical evaluation, standard laboratory diagnostic testing, or expert healthcare consultation.
      </div>
    </div>
  );
};
