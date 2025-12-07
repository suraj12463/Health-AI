
import React, { useState } from 'react';
import { MedicalAnalysisResult } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Printer, 
  Activity, 
  AlertOctagon, 
  FileSearch, 
  Stethoscope,
  Share2,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  Pill,
  Clock,
  Download,
  Copy,
  RefreshCw,
  ArrowRightLeft,
  AlertCircle,
  ExternalLink,
  Search,
  BookOpen
} from 'lucide-react';
import { ChatAssistant } from './ChatAssistant';

interface ResultDashboardProps {
  result: MedicalAnalysisResult;
  onReset: () => void;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  
  const { 
    riskLevel, 
    confidenceScore: confidenceLevel, 
    confidenceReason,
    keyFindings,
    riskFactors,
    earlyWarningAlerts,
    clinicalInterpretation,
    simplifiedExplanation,
    suggestedNextSteps
  } = result.structuredData;

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const formatMedicalText = (text: string, textColor = "text-slate-700") => {
    if (!text) return null;
    
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />;

      // Check for bullet points
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
      const cleanLine = isBullet ? trimmed.substring(2) : line;

      // Parse bold (**text**)
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Keep bold text distinct, but use currentColor opacity for consistency or simple bold class
          return <strong key={j} className="font-bold text-current opacity-100">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Parse italic (*text*) for Actions
      const parsedActions = parts.map((part) => {
        if (typeof part === 'string') {
          return part.split(/(\*.*?\*)/g).map((subPart, k) => {
             if (subPart.startsWith('*') && subPart.endsWith('*') && !subPart.startsWith('**')) {
                return <em key={k} className="not-italic font-semibold text-current opacity-90">{subPart.slice(1, -1)}</em>;
             }
             return subPart;
          });
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={i} className="flex items-start mb-1.5 pl-2">
            <span className={`mr-2 mt-2 h-1 w-1 bg-current rounded-full flex-shrink-0 opacity-60`} />
            <span className={`${textColor} leading-relaxed`}>{parsedActions}</span>
          </div>
        );
      }

      return <p key={i} className={`mb-1.5 ${textColor} leading-relaxed`}>{parsedActions}</p>;
    });
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('critical') || l.includes('high')) return 'bg-red-600 text-white';
    if (l.includes('moderate')) return 'bg-orange-500 text-white';
    if (l.includes('low')) return 'bg-emerald-600 text-white';
    return 'bg-slate-500 text-white';
  };

  const generateReportText = () => {
    const riskFactorsText = riskFactors && riskFactors.length > 0 
      ? riskFactors.map(r => `• ${r.factor} [${r.category}]: ${r.explanation}`).join('\n')
      : "No specific risk factors identified.";

    const stepsText = suggestedNextSteps && suggestedNextSteps.length > 0
      ? suggestedNextSteps.map((s, i) => {
          if (typeof s === 'string') return `${i+1}. ${s}`;
          let step = `${i+1}. ${s.action}`;
          
          if (s.dosage) step += `\n   - Dosage: ${s.dosage}`;
          if (s.frequency) step += `\n   - Frequency: ${s.frequency}`;
          
          step += `\n   - Details: ${s.description}`;
          
          if (s.interactions) step += `\n   - INTERACTIONS & CONSEQUENCES: ${s.interactions}`;
          if (s.sideEffects) step += `\n   - SIDE EFFECTS: ${s.sideEffects}`;
          if (s.warning) step += `\n   - WARNINGS: ${s.warning}`;
          
          const encoded = encodeURIComponent(s.action);
          step += `\n   - Verify (Google): https://www.google.com/search?q=${encoded}`;
          step += `\n   - Verify (WebMD): https://www.webmd.com/search/search_results/default.aspx?query=${encoded}`;
          step += `\n   - Verify (PubMed): https://pubmed.ncbi.nlm.nih.gov/?term=${encoded}`;
          
          return step;
        }).join('\n\n')
      : "No specific next steps provided.";

    const findingsText = keyFindings && keyFindings.length > 0 
      ? keyFindings.map(k => `• ${k.label}: ${k.value}`).join('\n')
      : "No specific quantitative findings extracted.";

    return `HEALTHAI - MEDICAL ANALYSIS REPORT
============================================================
Date: ${new Date().toLocaleDateString()}
Generated by: HealthAI
============================================================

[ PATIENT RISK PROFILE ]
Risk Level: ${riskLevel}
Confidence: ${confidenceLevel}
Reason: ${confidenceReason}

[ EARLY WARNING ALERTS ]
${earlyWarningAlerts || "No specific early warnings detected."}

[ KEY CLINICAL FINDINGS ]
${findingsText}

[ RISK FACTORS ]
${riskFactorsText}

[ CLINICAL INTERPRETATION ]
${clinicalInterpretation}

[ SUGGESTED NEXT STEPS ]
${stepsText}

[ SIMPLIFIED EXPLANATION ]
${simplifiedExplanation}

------------------------------------------------------------
DISCLAIMER: This report was generated by AI and is not a substitute for professional medical advice. Please consult a qualified healthcare provider.
`;
  };

  const handleCopyReport = async () => {
    const reportText = generateReportText();
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  };

  const handleDownloadReport = () => {
    const reportText = generateReportText();
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HealthAI-Detailed-Report-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const findingsSummary = keyFindings.length > 0 
      ? keyFindings.slice(0, 3).map(k => `• ${k.label}: ${k.value}`).join('\n')
      : "See full report for details.";
      
    const actionSummary = suggestedNextSteps.length > 0
      ? (typeof suggestedNextSteps[0] === 'string' ? suggestedNextSteps[0] : suggestedNextSteps[0].action)
      : "Consult healthcare provider.";

    const criticalAlert = (earlyWarningAlerts && !earlyWarningAlerts.toLowerCase().includes('no critical') && !earlyWarningAlerts.toLowerCase().includes('none')) 
      ? `\n⚠️ ALERT: ${earlyWarningAlerts}\n` 
      : '';

    const text = `HealthAI Summary 🩺
    
Risk Level: ${riskLevel}${criticalAlert}

Findings:
${findingsSummary}

Recommended Action:
👉 ${actionSummary}

(Generated by HealthAI)`;

    const shareData = {
      title: 'HealthAI Analysis Result',
      text: text,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
          await navigator.clipboard.writeText(text);
          setShared(true);
          setTimeout(() => setShared(false), 2000);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.error('Clipboard failed:', err);
      }
    }
  };

  const renderRiskFactors = () => {
    if (!riskFactors || riskFactors.length === 0) return null;

    const groups: Record<string, typeof riskFactors> = {};
    const uncategorized: typeof riskFactors = [];

    riskFactors.forEach(item => {
      if (item.category) {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      } else {
        uncategorized.push(item);
      }
    });

    const hasGroups = Object.keys(groups).length > 0;

    return (
      <div className="space-y-4">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-slate-100 pb-1">
              {category}
            </h5>
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-start text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-medical-400 mt-1.5 mr-2.5 flex-shrink-0" />
                  <span className="leading-relaxed">
                    <span className="font-medium text-slate-700">{item.factor}: </span>
                    {item.explanation}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {(!hasGroups || uncategorized.length > 0) && (
           <ul className="space-y-2 mt-4">
            {(hasGroups ? uncategorized : riskFactors).map((item, idx) => (
              <li key={idx} className="flex items-start text-sm text-slate-600">
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 mr-2.5 flex-shrink-0" />
                  <span className="leading-relaxed">
                    <span className="font-medium text-slate-700">{item.factor}: </span>
                    {item.explanation}
                  </span>
              </li>
            ))}
           </ul>
        )}
      </div>
    );
  };

  const getConfidenceDisplay = () => {
    const level = confidenceLevel?.toLowerCase() || 'low';
    const isHigh = level === 'high';
    const isMedium = level === 'medium';
    
    // Config based on level
    const config = isHigh 
      ? { 
          color: 'bg-emerald-500', 
          badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          icon: CheckCircle
        }
      : isMedium
        ? { 
            color: 'bg-amber-500', 
            badge: 'text-amber-700 bg-amber-50 border-amber-200',
            icon: AlertTriangle
          }
        : { 
            color: 'bg-red-500', 
            badge: 'text-red-700 bg-red-50 border-red-200',
            icon: AlertOctagon
          };

    const Icon = config.icon;

    return (
      <div className="group relative flex flex-col gap-1.5 min-w-[140px] cursor-help">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Confidence
              <Info className="h-3 w-3 text-slate-300 group-hover:text-medical-500 transition-colors" />
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${config.badge}`}>
                <Icon className="h-3 w-3" />
                {confidenceLevel || 'N/A'}
            </span>
        </div>
        
        {/* Segmented Progress Bar for Clearer Level Indication */}
        <div className="flex gap-1 h-1.5 w-full">
            {/* Segment 1: Always filled (Low/Med/High) */}
            <div className={`flex-1 rounded-full ${config.color} opacity-100 shadow-sm`} />
            
            {/* Segment 2: Filled for Med/High */}
            <div className={`flex-1 rounded-full transition-colors duration-300 ${isMedium || isHigh ? config.color : 'bg-slate-100'}`} />
            
            {/* Segment 3: Filled for High only */}
            <div className={`flex-1 rounded-full transition-colors duration-300 ${isHigh ? config.color : 'bg-slate-100'}`} />
        </div>
        
        {/* Hover Tooltip for Reason */}
        <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
          <div className="font-semibold mb-1 border-b border-slate-600 pb-1 flex justify-between items-center">
             <span>Analysis Confidence: {confidenceLevel}</span>
             <Icon className="h-3 w-3 text-slate-400" />
          </div>
          <div className="text-slate-300 leading-relaxed">
            {confidenceReason || 'Based on input data quality and clarity.'}
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute -top-1 right-8 w-2 h-2 bg-slate-800 transform rotate-45"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Status Bar & Action Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analysis Report</h2>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-2">
             <p className="text-slate-500 text-sm flex items-center">
                <span className="hidden sm:inline">Generated by HealthAI • </span>
                {new Date().toLocaleDateString()}
             </p>
             
             <div className="hidden sm:block h-8 w-px bg-slate-200"></div>

             {/* Visual Confidence Score */}
             {getConfidenceDisplay()}
          </div>
        </div>

        {/* Action Buttons - Responsive Grid on Mobile, Row on Desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleShare}
            className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-medical-600 transition-all shadow-sm active:scale-95"
          >
            {shared ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Share2 className="h-4 w-4 mr-2" />}
            {shared ? 'Sent' : 'Share'}
          </button>

          <button 
            onClick={handleDownloadReport}
            className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-medical-600 transition-all shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Detailed Report
          </button>
          
          <button 
            onClick={handleCopyReport}
            className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-medical-600 transition-all shadow-sm active:scale-95"
          >
            {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-medical-600 transition-all shadow-sm active:scale-95"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>

          {/* New Analysis - Full width on mobile if odd number of items causes layout issues, or keep simple grid */}
          <button 
            onClick={onReset}
            className="col-span-2 sm:col-span-1 flex items-center justify-center px-4 py-2 bg-slate-900 text-white border border-transparent rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New Analysis
          </button>
        </div>
      </div>

      {/* Main Analysis Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Risk Level Banner */}
        <div className={`${getRiskColor(riskLevel)} p-4 sm:px-6 flex justify-between items-center`}>
          <div className="flex items-center space-x-3">
            <AlertOctagon className="h-6 w-6 text-white" />
            <div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Overall Risk Assessment</p>
              <h3 className="text-xl font-bold text-white">{riskLevel} Risk Profile</h3>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-10">
          
          {/* Early Warning Alerts - Enhanced Visuals */}
          {(earlyWarningAlerts && earlyWarningAlerts !== 'None' && earlyWarningAlerts !== 'None detected') && (
            (() => {
                const isSafe = earlyWarningAlerts.toLowerCase().includes('no critical') || earlyWarningAlerts.toLowerCase().includes('no specific');
                
                return (
                    <div className={`rounded-xl border p-5 shadow-sm transition-all duration-300 ${
                        !isSafe
                            ? 'bg-red-50 border-red-200 border-l-4 border-l-red-500' 
                            : 'bg-emerald-50 border-emerald-200 border-l-4 border-l-emerald-500'
                        }`}>
                        <div className="flex items-start">
                            <div className={`p-2 rounded-full mr-4 flex-shrink-0 ${!isSafe ? 'bg-red-100' : 'bg-emerald-100'}`}>
                                {!isSafe ? (
                                    <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                                ) : (
                                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                                )}
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                                    !isSafe ? 'text-red-800' : 'text-emerald-800'
                                }`}>
                                    {!isSafe ? 'Critical Early Warning' : 'No Critical Alerts Detected'}
                                </h4>
                                <p className={`text-sm font-medium leading-relaxed ${
                                    !isSafe ? 'text-red-700' : 'text-emerald-700'
                                }`}>
                                    {earlyWarningAlerts}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })()
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Key Findings & Risk Factors */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Key Findings */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                  <FileSearch className="h-4 w-4 mr-2 text-medical-600" />
                  Key Clinical Findings
                </h4>
                <div className="space-y-3">
                  {keyFindings && keyFindings.length > 0 ? (
                    keyFindings.map((finding, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                        <span className="text-sm font-medium text-slate-500">{finding.label}</span>
                        <span className="text-sm font-bold text-slate-800 text-right ml-2">{finding.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">No specific quantitative findings extracted.</p>
                  )}
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-medical-600" />
                  Risk Factors
                </h4>
                {renderRiskFactors()}
              </div>
            </div>

            {/* Right Column: Interpretation & Next Steps */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Clinical Interpretation */}
              <div className="prose prose-slate max-w-none">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2 text-medical-600" />
                  Clinical Interpretation
                </h4>
                <div className="text-slate-700 leading-relaxed">
                  {formatMedicalText(clinicalInterpretation)}
                </div>
              </div>

              {/* Suggested Next Steps */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-medical-600" />
                  Suggested Next Steps
                </h4>
                <div className="space-y-3">
                  {suggestedNextSteps.map((step, idx) => {
                    const isExpanded = expandedSteps.includes(idx);
                    // Handle both string and object formats for backward compatibility
                    const actionTitle = typeof step === 'string' ? step : step.action;
                    const details = typeof step === 'string' ? '' : step.description;
                    const dosage = typeof step === 'object' ? step.dosage : null;
                    const frequency = typeof step === 'object' ? step.frequency : null;
                    const warning = typeof step === 'object' ? step.warning : null;
                    const interactions = typeof step === 'object' ? step.interactions : null;
                    const sideEffects = typeof step === 'object' ? step.sideEffects : null;
                    
                    const hasMedicationDetails = typeof step === 'object' && (step.dosage || step.frequency);
                    
                    // Interaction Warning Logic (Preview Badge)
                    const hasCriticalInteractions = interactions && (interactions.includes('[CRITICAL]') || interactions.includes('[MAJOR]'));

                    const encodedAction = encodeURIComponent(actionTitle);

                    return (
                      <div key={idx} className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                        isExpanded ? 'border-medical-200 bg-medical-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-medical-200'
                      }`}>
                        <button 
                          onClick={() => toggleStep(idx)}
                          className="w-full flex items-center justify-between p-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              isExpanded ? 'bg-medical-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                                <span className={`font-semibold text-sm ${isExpanded ? 'text-medical-900' : 'text-slate-800'}`}>
                                  {actionTitle}
                                </span>
                                {hasMedicationDetails && !isExpanded && (
                                   <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                     Rx
                                   </span>
                                )}
                                {interactions && !isExpanded && (
                                   <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${hasCriticalInteractions ? 'bg-red-100 text-red-800 border-red-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`} title="Potential interactions detected">
                                     <ArrowRightLeft className="h-3 w-3 mr-1" />
                                     {hasCriticalInteractions ? 'Critical Interactions' : 'Interactions'}
                                   </span>
                                )}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-medical-500" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 pl-[3.25rem] space-y-3 animate-fade-in">
                            
                            {/* Medication Details Block - REFINED */}
                            {hasMedicationDetails && (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-blue-100 p-1 rounded-md">
                                            <Pill className="h-3.5 w-3.5 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">Prescription Details</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {dosage && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-medium text-slate-500 mb-0.5">Dosage</span>
                                                <span className="text-sm font-bold text-slate-800">{dosage}</span>
                                            </div>
                                        )}
                                        {frequency && (
                                            <div className="flex flex-col">
                                                 <span className="text-[10px] uppercase font-medium text-slate-500 mb-0.5">Frequency</span>
                                                 <span className="text-sm font-bold text-slate-800">{frequency}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Interactions Warning Block - REFINED & SPLIT BY SEVERITY */}
                            {interactions && (
                                <div className="space-y-2">
                                   {interactions.split('\n').filter(i => i.trim()).map((interactionLine, i) => {
                                      // Detect severity markers from AI
                                      const isCritical = interactionLine.includes('[CRITICAL]') || interactionLine.includes('[MAJOR]');
                                      const isModerate = interactionLine.includes('[MODERATE]');
                                      const isMinor = interactionLine.includes('[MINOR]');
                                      
                                      // Clean the tags for display
                                      const cleanLine = interactionLine.replace(/\[(CRITICAL|MAJOR|MODERATE|MINOR)\]/g, '').trim();

                                      let containerClass = 'bg-rose-50 border-rose-100';
                                      let iconClass = 'text-rose-500';
                                      let textClass = 'text-rose-800';
                                      let titleText = 'Potential Interaction';
                                      let IconComp = ArrowRightLeft;

                                      if (isCritical) {
                                        containerClass = 'bg-red-50 border-red-200';
                                        iconClass = 'text-red-600';
                                        textClass = 'text-red-900 font-medium';
                                        titleText = 'CRITICAL INTERACTION';
                                        IconComp = AlertOctagon;
                                      } else if (isModerate) {
                                        containerClass = 'bg-orange-50 border-orange-200';
                                        iconClass = 'text-orange-600';
                                        textClass = 'text-orange-900';
                                        titleText = 'MODERATE INTERACTION';
                                        IconComp = AlertTriangle;
                                      } else if (isMinor) {
                                        containerClass = 'bg-blue-50 border-blue-200';
                                        iconClass = 'text-blue-500';
                                        textClass = 'text-blue-800';
                                        titleText = 'MINOR INTERACTION';
                                        IconComp = Info;
                                      }

                                      return (
                                        <div key={i} className={`rounded-lg p-3 flex gap-3 border ${containerClass}`}>
                                          <IconComp className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconClass}`} />
                                          <div className="w-full">
                                              <div className="flex items-center justify-between mb-1">
                                                <h5 className={`text-xs font-bold uppercase ${isCritical ? 'text-red-800' : isModerate ? 'text-orange-800' : 'text-blue-800'}`}>
                                                  {titleText}
                                                </h5>
                                                {isCritical && (
                                                  <span className="text-[10px] font-bold bg-red-100 text-red-800 px-1.5 py-0.5 rounded border border-red-200">
                                                    HIGH RISK
                                                  </span>
                                                )}
                                              </div>
                                              <div className={`text-sm leading-relaxed whitespace-pre-line ${textClass}`}>
                                                {formatMedicalText(cleanLine, textClass)}
                                              </div>
                                          </div>
                                        </div>
                                      );
                                   })}
                                </div>
                            )}

                            {/* Side Effects Block */}
                            {sideEffects && (
                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3">
                                   <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                   <div className="w-full">
                                      <h5 className="text-xs font-bold text-amber-700 uppercase mb-1">Potential Side Effects</h5>
                                      <div className="text-sm text-amber-800 leading-relaxed">
                                        {formatMedicalText(sideEffects, "text-amber-800")}
                                      </div>
                                   </div>
                                </div>
                            )}

                            {/* Warning Block */}
                            {warning && (
                                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                    <p className="text-sm font-bold text-red-700 flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                                        {warning}
                                    </p>
                                </div>
                            )}
                            
                            {/* Main Description */}
                            <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                                {details}
                            </p>

                            {/* Verification Links */}
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                                <span className="text-xs text-slate-400 font-medium flex items-center h-6">Verify info:</span>
                                <a 
                                  href={`https://www.google.com/search?q=${encodedAction}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 rounded bg-slate-50 hover:bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
                                >
                                  <Search className="h-3 w-3 mr-1" /> Google
                                </a>
                                <a 
                                  href={`https://www.webmd.com/search/search_results/default.aspx?query=${encodedAction}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 rounded bg-slate-50 hover:bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" /> WebMD
                                </a>
                                <a 
                                  href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodedAction}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 rounded bg-slate-50 hover:bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
                                >
                                  <BookOpen className="h-3 w-3 mr-1" /> PubMed
                                </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simplified Explanation */}
              <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-indigo-600" />
                  Simplified Explanation (Plain Language)
                </h4>
                <div className="text-indigo-800 text-sm leading-relaxed">
                  {formatMedicalText(simplifiedExplanation, "text-indigo-800")}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* Contextual Chat Assistant */}
      <div className="mt-8 print:hidden">
        <ChatAssistant analysisContext={JSON.stringify(result.structuredData)} />
      </div>

    </div>
  );
};
