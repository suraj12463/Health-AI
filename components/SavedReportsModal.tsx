import React from 'react';
import { X, Calendar, Trash2, ArrowRight, FileText, Clock } from 'lucide-react';
import { SavedAnalysis } from '../types';

interface SavedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: SavedAnalysis[];
  onLoad: (report: SavedAnalysis) => void;
  onDelete: (id: string) => void;
}

export const SavedReportsModal: React.FC<SavedReportsModalProps> = ({ 
  isOpen, 
  onClose, 
  reports, 
  onLoad, 
  onDelete 
}) => {
  if (!isOpen) return null;

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('critical') || l.includes('high')) return 'text-red-600 bg-red-50 border-red-200';
    if (l.includes('moderate')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (l.includes('low')) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-medical-600" />
              Saved Analysis History
            </h3>
            <p className="text-sm text-slate-500">Access your previously generated medical reports.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <h4 className="text-lg font-medium text-slate-900">No Saved Reports</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                When you analyze a medical report, click "Save Analysis" to store it here for future reference.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        <Calendar className="h-3 w-3 mr-1" />
                        {report.dateLabel}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getRiskColor(report.riskLevel)}`}>
                        {report.riskLevel} Risk
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(report.id);
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                    Analysis Report #{report.id.slice(-4)}
                  </h4>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {report.summary}
                  </p>

                  <button
                    onClick={() => onLoad(report)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-medical-600 transition-colors"
                  >
                    View Full Analysis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};