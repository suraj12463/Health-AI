import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="bg-medical-600 p-2 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-slate-900 tracking-tight">
              Health<span className="text-medical-600">AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <ShieldCheck className="h-4 w-4 mr-2 text-medical-600" />
              <span>HIPAA Compliant Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};