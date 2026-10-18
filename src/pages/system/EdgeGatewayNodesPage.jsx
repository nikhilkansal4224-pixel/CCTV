import React from 'react';
import { Server, Cpu, HardDrive, Thermometer, Activity, RefreshCw } from 'lucide-react';
import { MOCK_EDGE_NODES } from '../../data/mockData';

export default function EdgeGatewayNodesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="text-cyan-400" size={22} />
            Edge Gateway Hardware Clusters & Nodes
            <span className="badge badge-cyan text-xs">Route #77</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry: NVIDIA Jetson Orin GPU utilization, core temperatures, RAM, and inference FPS throughput
          </p>
        </div>

        <button className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5">
          <RefreshCw size={14} />
          <span>Poll Cluster Telemetry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_EDGE_NODES.map(node => (
          <div key={node.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-cyan-400">{node.id}</span>
              <span className={`badge ${node.status === 'healthy' ? 'badge-emerald' : 'badge-amber'} text-[10px]`}>
                {node.status.toUpperCase()}
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-white font-sans">{node.name}</h2>
              <div className="text-[11px] text-slate-400 mt-0.5">{node.hardware}</div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>GPU Core Utilization</span>
                  <span className="text-cyan-400 font-bold">{node.gpuUtil}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${node.gpuUtil}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>System RAM Memory</span>
                  <span className="text-purple-400 font-bold">{node.ramUtil}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${node.ramUtil}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Core Temp</span>
                <span className="text-amber-400 font-bold">{node.tempC}°C</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Inference FPS</span>
                <span className="text-emerald-400 font-bold">{node.fpsThroughput} FPS</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Uptime</span>
                <span className="text-slate-200">{node.uptime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
