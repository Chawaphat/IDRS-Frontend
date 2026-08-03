import React from 'react';
import { Activity } from 'lucide-react';

export default function AIAnalysisPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full flex flex-col space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Activity className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">AI Analysis Hub</h2>
          <p className="text-slate-500 mt-1">Review AI generated insights and detections.</p>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
        <Activity className="w-16 h-16 mb-4 text-slate-200" />
        <h3 className="text-xl font-bold text-slate-700">AI Detection</h3>
        <p className="mt-2 text-sm text-center max-w-md">The global AI detection overview will be built here soon.</p>
      </div>
    </div>
  );
}
