
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ResultDashboard } from './components/ResultDashboard';
import { SymptomSelector } from './components/SymptomSelector';
import { SavedReportsModal } from './components/SavedReportsModal';
import { analyzeMedicalData } from './services/geminiService';
import { UploadedFile, AnalysisState, SavedAnalysis } from './types';
import { 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ClipboardList, 
  Mic, 
  MicOff, 
  History, 
  Activity, 
  Stethoscope, 
  ShieldCheck, 
  Scan, 
  FileSearch, 
  BrainCircuit, 
  CheckCircle 
} from 'lucide-react';

// Skeleton Component to mimic the ResultDashboard layout
const SkeletonDashboard = () => (
  <div className="w-full max-w-6xl mx-auto space-y-8 opacity-40 select-none pointer-events-none absolute inset-0 z-0 p-4 overflow-hidden">
     {/* Risk Banner Skeleton */}
     <div className="h-24 bg-slate-200 rounded-xl w-full animate-pulse"></div>
     
     {/* Early Warning Skeleton */}
     <div className="h-20 bg-slate-200 rounded-xl w-full animate-pulse delay-75"></div>

     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col Skeleton */}
        <div className="space-y-8">
           <div className="h-48 bg-slate-200 rounded-xl animate-pulse delay-100"></div>
           <div className="h-64 bg-slate-200 rounded-xl animate-pulse delay-150"></div>
        </div>
        
        {/* Right Col Skeleton */}
        <div className="lg:col-span-2 space-y-8">
           <div className="h-32 bg-slate-200 rounded-xl animate-pulse delay-200"></div>
           <div className="h-24 bg-slate-200 rounded-lg animate-pulse delay-300"></div>
           <div className="h-24 bg-slate-200 rounded-lg animate-pulse delay-500"></div>
           <div className="h-40 bg-slate-200 rounded-xl animate-pulse delay-700"></div>
        </div>
     </div>
  </div>
);

const LoadingView = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { text: "Securely encrypting & uploading data...", icon: ShieldCheck },
    { text: "Extracting clinical values & vitals...", icon: Scan },
    { text: "Analyzing symptoms & medical context...", icon: Stethoscope },
    { text: "Cross-referencing medical databases...", icon: FileSearch },
    { text: "Formulating clinical insights...", icon: BrainCircuit }
  ];

  useEffect(() => {
    // Progress through steps, but hold on the last one until done
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500); // 2.5 seconds per step

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center">
      {/* Background Skeleton Layer */}
      <SkeletonDashboard />

      {/* Foreground Processing Card */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 sm:p-10 text-center transform transition-all">
          {/* Central Spinner & Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Outer Ring */}
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            {/* Spinning Segment */}
            <div className="absolute inset-0 border-4 border-t-medical-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            
            {/* Centered Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-medical-50 p-3 rounded-full animate-pulse">
                <CurrentIcon className="h-8 w-8 text-medical-600" />
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2 transition-all duration-300 min-h-[3rem] flex items-center justify-center">
            {steps[currentStep].text}
          </h3>
          <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
            Our AI is processing your medical data with HIPAA-compliant security protocols.
          </p>

          {/* Progress Checklist */}
          <div className="space-y-3 max-w-sm mx-auto text-left bg-slate-50/80 p-5 rounded-xl border border-slate-100/50">
            {steps.map((step, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;

              return (
                <div 
                  key={idx} 
                  className={`flex items-center transition-all duration-500 ${
                    isActive || isCompleted ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className={`
                    mr-3 flex-shrink-0 transition-all duration-300
                    ${isCompleted ? 'text-green-500' : isActive ? 'text-medical-600' : 'text-slate-400'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedAnalysis[]>(() => {
    const saved = localStorage.getItem('healthAI_reports');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Append only final results to state to avoid overwriting existing text too aggressively
        if (finalTranscript) {
          setSymptoms(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.start();
    } else {
      alert("Voice dictation is not supported in this browser.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleAnalyze = async () => {
    if (!symptoms.trim() && !selectedFile) {
      setAnalysis(prev => ({
        ...prev,
        error: "Please provide either a medical document or describe your symptoms to proceed."
      }));
      return;
    }

    setAnalysis({ isLoading: true, error: null, result: null });

    try {
      const result = await analyzeMedicalData(
        selectedFile ? selectedFile.data : null,
        selectedFile ? selectedFile.mimeType : null,
        symptoms
      );
      setAnalysis({ isLoading: false, error: null, result });
    } catch (err: any) {
      setAnalysis({
        isLoading: false,
        error: err.message || "An unexpected error occurred.",
        result: null,
      });
    }
  };

  const saveAnalysis = () => {
    if (!analysis.result) return;

    const riskLevel = analysis.result.structuredData.riskLevel || "Unknown";
    // Create a simple summary from key findings or interpretation
    const summary = analysis.result.structuredData.clinicalInterpretation.slice(0, 100) + "...";

    const newReport: SavedAnalysis = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateLabel: new Date().toLocaleDateString(),
      riskLevel,
      summary,
      result: analysis.result
    };

    const updatedReports = [newReport, ...savedReports];
    setSavedReports(updatedReports);
    localStorage.setItem('healthAI_reports', JSON.stringify(updatedReports));
    alert("Report saved successfully!");
  };

  const loadReport = (report: SavedAnalysis) => {
    setAnalysis({
      isLoading: false,
      error: null,
      result: report.result
    });
    setIsHistoryModalOpen(false);
  };

  const deleteReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem('healthAI_reports', JSON.stringify(updated));
  };

  const resetApp = () => {
    setSelectedFile(null);
    setSymptoms('');
    setAnalysis({ isLoading: false, error: null, result: null });
  };

  const handleFileSelect = (file: UploadedFile | null) => {
    setSelectedFile(file);
    if (analysis.error) setAnalysis(prev => ({ ...prev, error: null }));
  };

  const handleSymptomsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSymptoms(e.target.value);
    if (analysis.error) setAnalysis(prev => ({ ...prev, error: null }));
  };

  const handleSymptomsAdded = (selectedSymptoms: string[]) => {
    setSymptoms(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return selectedSymptoms.join(', ');
      const lastChar = trimmed.slice(-1);
      const separator = (lastChar === ',' || lastChar === '.') ? ' ' : ', '; 
      return trimmed + separator + selectedSymptoms.join(', ');
    });
    if (analysis.error) setAnalysis(prev => ({ ...prev, error: null }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Floating Save Button / History Toggle if Result exists, or just History on home */}
        {!analysis.isLoading && (
          <div className="flex justify-end mb-4 gap-3">
               {analysis.result && (
                  <button 
                    onClick={saveAnalysis}
                    className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Save Analysis
                  </button>
               )}
               <button 
                 onClick={() => setIsHistoryModalOpen(true)}
                 className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center"
               >
                 <History className="h-4 w-4 mr-2" />
                 History
               </button>
          </div>
        )}

        {analysis.isLoading ? (
          <LoadingView />
        ) : analysis.result ? (
          <ResultDashboard result={analysis.result} onReset={resetApp} />
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
                Understand Your <span className="text-medical-600">Medical Data</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload reports, scans, or describe your symptoms. Our advanced AI performs clinical-level interpretation to help you make informed decisions.
              </p>
            </div>

            {/* Input Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-8 space-y-8">
                
                {/* File Upload Section */}
                <div>
                  <FileUpload 
                    onFileSelect={handleFileSelect} 
                    selectedFile={selectedFile} 
                  />
                </div>

                {/* Symptoms Input */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="symptoms" className="block text-sm font-medium text-slate-700">
                      Symptoms & Context
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      id="symptoms"
                      rows={5}
                      className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 sm:text-sm p-4 pb-14 border bg-slate-50 placeholder-slate-400"
                      placeholder="Describe your symptoms, or paste text from a medical report here... (e.g., 'Sharp pain in lower right abdomen, mild fever')"
                      value={symptoms}
                      onChange={handleSymptomsChange}
                    />
                    
                    {/* Integrated Tools Toolbar */}
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center px-1 pointer-events-none">
                      {/* Left: Symptom Checker Trigger */}
                      <button
                        onClick={() => setIsSymptomModalOpen(true)}
                        className="pointer-events-auto flex items-center space-x-2 text-xs font-medium text-medical-600 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-medical-200 hover:bg-medical-50 transition-colors shadow-sm group"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-medical-500 group-hover:text-medical-600" />
                        <span>Symptom Checker</span>
                      </button>

                      {/* Right: Voice Dictation Trigger */}
                      <button
                        onClick={toggleListening}
                        className={`pointer-events-auto flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm border ${
                          isListening 
                            ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' 
                            : 'bg-white/80 backdrop-blur-sm border-slate-200 text-slate-500 hover:text-medical-600 hover:border-medical-200'
                        }`}
                        title="Dictate symptoms"
                      >
                         {isListening ? (
                           <>
                             <MicOff className="h-3.5 w-3.5" />
                             <span>Stop Recording</span>
                           </>
                         ) : (
                           <>
                             <Mic className="h-3.5 w-3.5" />
                             <span>Dictate</span>
                           </>
                         )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {analysis.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    {analysis.error}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={analysis.isLoading}
                  className={`w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-medium text-white transition-all duration-200
                    ${analysis.isLoading 
                      ? 'bg-slate-300 cursor-not-allowed' 
                      : 'bg-medical-600 hover:bg-medical-700 hover:shadow-md transform hover:-translate-y-0.5'
                    }
                  `}
                >
                  Analyze Reports
                  <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                </button>
              </div>
              
              <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                <span>Secure Analysis Environment</span>
                <span>Powered by Gemini 2.5 Flash</span>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-medical-100 mb-4">
                  <Activity className="h-6 w-6 text-medical-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">High Accuracy</h3>
                <p className="mt-2 text-sm text-slate-500">Cross-referenced with verified medical journals and databases.</p>
              </div>
              <div className="p-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                  <Stethoscope className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Instant Results</h3>
                <p className="mt-2 text-sm text-slate-500">Get clinical insights in seconds, not days waiting for appointments.</p>
              </div>
              <div className="p-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Private & Secure</h3>
                <p className="mt-2 text-sm text-slate-500">Data is processed in memory and never stored on persistent servers.</p>
              </div>
            </div>
          </div>
        )}

        <SymptomSelector 
          isOpen={isSymptomModalOpen} 
          onClose={() => setIsSymptomModalOpen(false)} 
          onSelect={handleSymptomsAdded} 
        />

        <SavedReportsModal 
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          reports={savedReports}
          onLoad={loadReport}
          onDelete={deleteReport}
        />
      </main>
    </div>
  );
};

export default App;
