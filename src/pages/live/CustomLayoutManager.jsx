import React, { useState } from 'react';
import { LayoutGrid, Plus, Trash2, Check, Video, Eye } from 'lucide-react';
import { MOCK_CAMERAS } from '../../data/mockData';

export default function CustomLayoutManager() {
  const [layouts, setLayouts] = useState([
    { id: 'lay-1', name: 'Perimeter Defense Wall', cameras: ['cam-01', 'cam-06', 'cam-08', 'cam-02'], isDefault: true },
    { id: 'lay-2', name: 'Logistics & Loading Docks', cameras: ['cam-03', 'cam-05', 'cam-07'], isDefault: false },
    { id: 'lay-3', name: 'High-Security Vault & Ingress', cameras: ['cam-04', 'cam-02', 'cam-01'], isDefault: false },
  ]);

  const [newLayoutName, setNewLayoutName] = useState('');
  const [selectedCams, setSelectedCams] = useState(['cam-01', 'cam-02']);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newLayoutName.trim()) return;
    const newL = {
      id: `lay-${Date.now()}`,
      name: newLayoutName,
      cameras: selectedCams,
      isDefault: false
    };
    setLayouts([...layouts, newL]);
    setNewLayoutName('');
  };

  const toggleCam = (id) => {
    if (selectedCams.includes(id)) {
      setSelectedCams(selectedCams.filter(c => c !== id));
    } else {
      setSelectedCams([...selectedCams, id]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <LayoutGrid className="text-cyan-400" size={22} />
          Custom Layout Manager
          <span className="badge badge-cyan text-xs">Route #34</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Create, arrange, and save custom multi-camera grid arrangements for specialized monitoring posts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Layouts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
            Active Guard Presets ({layouts.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layouts.map(layout => (
              <div key={layout.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-base">{layout.name}</h3>
                    {layout.isDefault && (
                      <span className="badge badge-emerald text-[10px]">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-3">
                    Assigned Streams: {layout.cameras.length} cameras
                  </p>
                  
                  {/* Miniature Grid Preview */}
                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 mb-3">
                    {layout.cameras.slice(0, 4).map(camId => {
                      const cam = MOCK_CAMERAS.find(c => c.id === camId);
                      return (
                        <div key={camId} className="h-14 rounded bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-1 text-[10px] text-center">
                          <Video size={12} className="text-cyan-400 mb-0.5" />
                          <span className="truncate w-full text-slate-300 font-mono">{cam?.name || camId}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button className="btn btn-primary btn-sm flex items-center gap-1.5">
                    <Eye size={12} /> Launch in Command Grid
                  </button>
                  <button 
                    onClick={() => setLayouts(layouts.filter(l => l.id !== layout.id))}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Builder Form */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
            <Plus size={16} className="text-cyan-400" />
            Build New Layout
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Layout Preset Name</label>
              <input 
                type="text" 
                value={newLayoutName}
                onChange={e => setNewLayoutName(e.target.value)}
                placeholder="e.g. Night Gate Watch"
                className="form-input text-xs"
                required
              />
            </div>

            <div>
              <label className="form-label">Select Streams to Include</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {MOCK_CAMERAS.map(cam => {
                  const isChecked = selectedCams.includes(cam.id);
                  return (
                    <div 
                      key={cam.id} 
                      onClick={() => toggleCam(cam.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                        isChecked 
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Video size={13} className={isChecked ? 'text-cyan-400' : 'text-slate-500'} />
                        <span className="truncate">{cam.name}</span>
                      </div>
                      {isChecked && <Check size={14} className="text-cyan-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full text-xs font-bold py-2.5">
              Save Custom Layout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
