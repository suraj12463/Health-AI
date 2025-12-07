
import React, { useState, useMemo } from 'react';
import { X, Check, Activity, Thermometer, Wind, Zap, Search, Heart, Brain, Star, AlertCircle, Filter, Smile } from 'lucide-react';

interface SymptomSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: string[]) => void;
}

// Enhanced Synonyms mapping for better search experience
const SYNONYMS: Record<string, string[]> = {
  'Fever': ['high temperature', 'hot', 'pyrexia', 'burning up', 'chills', 'feverish', 'feeling hot'],
  'Fatigue': ['tired', 'exhaustion', 'weak', 'weary', 'lethargy', 'drained', 'no energy', 'sleepy', 'burnout'],
  'Nausea': ['queasy', 'sick to stomach', 'urges to vomit', 'upset stomach', 'nauseous', 'groggy'],
  'Vomiting': ['throwing up', 'puke', 'barf', 'sickness', 'retching', 'heaving'],
  'Abdominal pain': ['stomach ache', 'belly pain', 'tummy ache', 'gut pain', 'cramps', 'stomach pain', 'pain in stomach', 'gastritis'],
  'Diarrhea': ['runny stool', 'loose stools', 'the runs', 'poop', 'liquid stool', 'dysentery', 'bowel issues'],
  'Shortness of breath': ['dyspnea', 'hard to breathe', 'winded', 'gasping', 'cant breathe', 'breathless', 'short breath', 'air hunger'],
  'Edema': ['swelling', 'puffy', 'fluid retention', 'swollen', 'bloated', 'puffiness'],
  'Headache': ['migraine', 'head pain', 'throbbing head', 'splitting headache', 'tension headache', 'head pressure'],
  'Insomnia': ['cant sleep', 'sleepless', 'awake', 'trouble sleeping', 'restless', 'waking up'],
  'Weight loss': ['lost weight', 'skinny', 'thin', 'shedding pounds', 'anorexia'],
  'Hypertension': ['high blood pressure', 'bp', 'elevated pressure'],
  'Chest pain': ['angina', 'tight chest', 'pressure', 'heart pain', 'chest tightness', 'heavy chest'],
  'Rash': ['spots', 'hives', 'breakout', 'skin irritation', 'itchy skin', 'redness', 'eczema', 'dermatitis', 'acne'],
  'Joint pain': ['arthritis', 'stiff joints', 'aching joints', 'knee pain', 'elbow pain', 'wrist pain', 'hip pain', 'gout'],
  'Cough': ['coughing', 'hack', 'phlegm', 'dry cough', 'wet cough', 'barking cough'],
  'Sore throat': ['throat pain', 'hurts to swallow', 'pharyngitis', 'scratchy throat', 'strep', 'tonsillitis'],
  'Dizziness': ['lightheaded', 'spinning', 'vertigo', 'unsteady', 'faint', 'woozy', 'balance issues'],
  'Palpitations': ['racing heart', 'heart skip', 'fluttering', 'thumping', 'rapid heartbeat', 'heart pounding'],
  'Tremors': ['shaking', 'shivers', 'twitching', 'trembling', 'shakes'],
  'Vision changes': ['blurry vision', 'seeing double', 'vision loss', 'spots in eyes', 'blindness', 'eye strain'],
  'Confusion': ['disoriented', 'brain fog', 'mixed up', 'delirium', 'memory loss', 'forgetful'],
  'Numbness': ['tingling', 'pins and needles', 'loss of sensation', 'asleep limb', 'paresthesia'],
  'Constipation': ['cant poop', 'hard stool', 'blocked', 'irregular', 'strained bowel'],
  'Indigestion': ['heartburn', 'acid reflux', 'gerd', 'burping', 'gas', 'bloating'],
  'Muscle ache': ['body ache', 'sore muscles', 'painful muscles', 'myalgia', 'cramps'],
  'Runny nose': ['snot', 'boogers', 'nasal drip', 'rhinorrhea', 'stuffy nose'],
  'Sneezing': ['achoo', 'sneezes', 'allergy'],
  'Itching': ['scratchy', 'itch', 'pruritus'],
  'Watery eyes': ['tearing', 'crying', 'teary', 'red eyes'],
  'Chills': ['shivering', 'cold', 'goosebumps', 'feeling cold'],
  'Sweating': ['perspiration', 'sweaty', 'clammy', 'hot flashes'],
  'Night sweats': ['sweating at night', 'soaked sheets'],
  'Anxiety': ['nervous', 'worry', 'panic', 'stress', 'uneasy', 'fear', 'tension'],
  'Depression': ['sad', 'down', 'hopeless', 'unhappy', 'blues', 'low mood'],
  'Mood swings': ['emotional', 'irritable', 'bipolar'],
};

// Helper: Levenshtein distance for fuzzy search (typo tolerance)
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

// Get match score (Higher is better)
const getMatchScore = (text: string, query: string): number => {
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  // 1. Exact Match (Highest Priority)
  if (t === q) return 100;

  // 2. Starts With (High Priority)
  if (t.startsWith(q)) return 80;

  // 3. Contains (Medium Priority)
  if (t.includes(q)) return 60;

  // 4. Fuzzy Match (Typo Tolerance)
  if (q.length > 2) {
    const distance = levenshteinDistance(q, t);
    // Dynamic tolerance: Allow 1 error for short words, 2 for longer
    const allowedErrors = q.length > 5 ? 2 : 1;
    
    if (distance <= allowedErrors) {
      // Score reduces by distance
      return 50 - (distance * 10);
    }
  }

  return 0; // No match
};

const COMMON_GROUPS = [
  { 
    label: 'Cold & Flu', 
    color: 'text-sky-700 bg-sky-50 border-sky-100',
    items: ['Fever', 'Cough', 'Sore throat', 'Fatigue', 'Chills', 'Runny nose', 'Congestion'] 
  },
  { 
    label: 'Digestive Issues', 
    color: 'text-orange-700 bg-orange-50 border-orange-100',
    items: ['Nausea', 'Vomiting', 'Abdominal pain', 'Diarrhea', 'Bloating', 'Indigestion', 'Constipation'] 
  },
  { 
    label: 'Pain & Discomfort', 
    color: 'text-rose-700 bg-rose-50 border-rose-100',
    items: ['Headache', 'Back pain', 'Muscle ache', 'Joint pain', 'Chest pain', 'Neck pain'] 
  },
  {
    label: 'Allergies',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    items: ['Runny nose', 'Sneezing', 'Itching', 'Rash', 'Watery eyes', 'Hives']
  }
];

const CATEGORIES = {
  'General': {
    icon: <Thermometer className="w-4 h-4" />,
    items: ['Fever', 'Fatigue', 'Chills', 'Weakness', 'Dizziness', 'Insomnia', 'Weight loss', 'Night sweats', 'Sweating']
  },
  'Respiratory': {
    icon: <Wind className="w-4 h-4" />,
    items: ['Cough', 'Shortness of breath', 'Sore throat', 'Runny nose', 'Wheezing', 'Chest congestion', 'Congestion', 'Sneezing']
  },
  'Digestive': {
    icon: <Activity className="w-4 h-4" />,
    items: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Bloating', 'Heartburn', 'Loss of appetite', 'Indigestion', 'Constipation']
  },
  'Cardiovascular': {
    icon: <Heart className="w-4 h-4" />,
    items: ['Chest pain', 'Palpitations', 'Fast heart rate', 'Swollen legs', 'Cold extremities', 'Irregular heartbeat']
  },
  'Neurological': {
    icon: <Brain className="w-4 h-4" />,
    items: ['Headache', 'Confusion', 'Numbness', 'Tremors', 'Seizures', 'Slurred speech', 'Vision changes']
  },
  'Pain': {
    icon: <Zap className="w-4 h-4" />,
    items: ['Back pain', 'Joint pain', 'Muscle ache', 'Neck pain', 'Sharp pain', 'Dull ache']
  },
  'Skin': {
    icon: <Activity className="w-4 h-4" />,
    items: ['Rash', 'Itching', 'Redness', 'Swelling', 'Bruising', 'Dry skin', 'Hives', 'Watery eyes']
  },
  'Mental Health': {
    icon: <Smile className="w-4 h-4" />,
    items: ['Anxiety', 'Depression', 'Mood swings', 'Panic attacks', 'Stress', 'Irritability']
  }
};

export const SymptomSelector: React.FC<SymptomSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  // Use a Set to track multiple selected categories. Initialize with 'All'.
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(['All']));

  if (!isOpen) return null;

  const toggleSymptom = (symptom: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(symptom)) {
      newSelected.delete(symptom);
    } else {
      newSelected.add(symptom);
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    setSelected(new Set()); // Reset
    setSearchQuery('');
    setActiveCategories(new Set(['All']));
    onClose();
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const toggleCategory = (cat: string) => {
    const newCats = new Set(activeCategories);

    if (cat === 'All') {
      // If All is clicked, clear others and set only All
      setActiveCategories(new Set(['All']));
      return;
    }

    // If specific category is clicked, remove 'All' if it exists
    if (newCats.has('All')) {
      newCats.delete('All');
    }

    // Toggle the clicked category
    if (newCats.has(cat)) {
      newCats.delete(cat);
    } else {
      newCats.add(cat);
    }

    // If no categories remain selected, default back to 'All'
    if (newCats.size === 0) {
      setActiveCategories(new Set(['All']));
    } else {
      setActiveCategories(newCats);
    }
  };

  const categoryKeys = ['All', ...Object.keys(CATEGORIES)];

  // Memoized filter logic for performance
  // Filter categories based on category selection AND fuzzy search with scoring
  const displayedCategories = useMemo(() => {
    return Object.entries(CATEGORIES).map(([category, data]) => {
      // 1. Filter by Active Category Selection
      const isAll = activeCategories.has('All');
      if (!isAll && !activeCategories.has(category)) {
        return null;
      }
  
      const query = searchQuery.trim();
      
      // 2. If no query, return category as is
      if (!query) return [category, data];
  
      // 3. Scoring Logic
      // Check match on Category Name
      const categoryScore = getMatchScore(category, query);
  
      // Calculate score for each item in the category
      const scoredItems = data.items.map(item => {
        let maxScore = getMatchScore(item, query);
  
        // Check synonyms for better match
        const itemSynonyms = SYNONYMS[item];
        if (itemSynonyms) {
          for (const syn of itemSynonyms) {
            const synScore = getMatchScore(syn, query);
            if (synScore > maxScore) maxScore = synScore;
          }
        }
        return { item, score: maxScore };
      });
  
      // Filter items with any relevance
      const relevantItems = scoredItems.filter(i => i.score > 0);
      
      // Sort items by relevance score (Desc)
      relevantItems.sort((a, b) => b.score - a.score);
  
      // If category name matches strongly, show the category with all items
      if (categoryScore >= 90) {
         return [category, data];
      }
      
      // Otherwise, only return if there are matching items
      if (relevantItems.length > 0) {
        return [category, { ...data, items: relevantItems.map(i => i.item) }];
      }
      
      return null;
    }).filter(Boolean) as [string, typeof CATEGORIES['General']][];
  }, [searchQuery, activeCategories]);

  const hasResults = displayedCategories.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col transform transition-all animate-fade-in scale-100 opacity-100">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Symptom Checker</h3>
              <p className="text-sm text-slate-500">Select observed symptoms for clinical context</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search symptoms (e.g., 'fever', 'tummy ache')..."
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar -mx-1 px-1">
              <div className="flex items-center pr-2 border-r border-slate-200 mr-2 flex-shrink-0">
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
              {categoryKeys.map((cat) => {
                const isActive = activeCategories.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`
                      flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center border
                      ${isActive 
                        ? 'bg-medical-600 text-white border-medical-600 shadow-sm ring-2 ring-medical-100 ring-offset-1' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }
                    `}
                  >
                    {isActive && <Check className="w-3 h-3 mr-1.5" />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
          
          {/* Common Symptoms Section - Grouped by Condition (Only show if not searching/filtering) */}
          {!searchQuery && activeCategories.has('All') && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
                <span className="text-amber-500 bg-amber-50 p-1.5 rounded-lg">
                  <Star className="w-4 h-4 fill-amber-500" />
                </span>
                <span className="uppercase tracking-wide text-xs">Frequent Conditions</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {COMMON_GROUPS.map((group) => (
                  <div key={group.label} className={`p-4 rounded-xl border ${group.color} bg-opacity-50 h-full hover:shadow-sm transition-shadow`}>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-90">{group.label}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => toggleSymptom(item)}
                          className={`
                            inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 border select-none bg-white/80
                            ${selected.has(item) 
                              ? 'border-medical-500 text-medical-700 shadow-sm ring-1 ring-medical-200' 
                              : 'border-transparent hover:border-slate-200 text-slate-600 shadow-sm'
                            }
                          `}
                        >
                          {selected.has(item) && <Check className="h-3 w-3 mr-1" />}
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasResults ? (
            <div className={`grid grid-cols-1 ${activeCategories.has('All') ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8`}>
              {displayedCategories.map(([category, { icon, items }]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center space-x-2 text-slate-800 font-semibold border-b border-slate-100 pb-2 mb-3">
                    <span className="text-medical-600 bg-medical-50 p-1.5 rounded-lg">{icon}</span>
                    <span className="uppercase tracking-wide text-xs">{category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleSymptom(item)}
                        className={`
                          inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border select-none
                          ${selected.has(item) 
                            ? 'bg-medical-600 text-white border-medical-600 shadow-md ring-2 ring-medical-100 ring-offset-1' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-medical-300 hover:bg-slate-50'
                          }
                        `}
                      >
                        {selected.has(item) && <Check className="h-3.5 w-3.5 mr-1.5" />}
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
              <div className="bg-slate-50 p-4 rounded-full mb-3">
                 <AlertCircle className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-900">No symptoms found</p>
              <p className="text-sm mt-1 max-w-xs">
                We couldn't find matches for "{searchQuery}" {activeCategories.size > 0 && !activeCategories.has('All') ? `in selected categories` : ''}.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Tip: Try using common terms like "tummy ache" or "tired".
              </p>
              <button 
                onClick={clearSearch} 
                className="mt-4 text-sm text-medical-600 hover:text-medical-700 font-medium"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center z-10">
            <span className="text-sm text-slate-500 font-medium">
                {selected.size} symptom{selected.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleConfirm}
                    disabled={selected.size === 0}
                    className={`px-6 py-2 rounded-lg font-bold text-white transition-all shadow-sm
                        ${selected.size > 0 
                            ? 'bg-medical-600 hover:bg-medical-700 hover:shadow-md transform hover:-translate-y-0.5' 
                            : 'bg-slate-300 cursor-not-allowed'}
                    `}
                >
                    Add Selected Symptoms
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
