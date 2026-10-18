import React from 'react';
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogDirectoryPage() {
  const posts = [
    { slug: 'edge-ai-vs-cloud-video-latency', title: 'Edge AI vs Cloud Video Latency: Why 15 Seconds Means the Robbery is Already Over', date: 'Oct 12, 2026', readTime: '6 min read', tag: 'Architecture' },
    { slug: 'zero-false-alarm-polygon-tripwires', title: 'Zero False Alarms: Mathematical Approaches to Harmonic Tree Motion Suppression', date: 'Oct 04, 2026', readTime: '8 min read', tag: 'Computer Vision' },
    { slug: 'ndaa-compliance-guide-2026', title: 'NDAA & SOC2 Compliance: Removing Banned Silicon from Physical Perimeters', date: 'Sep 28, 2026', readTime: '5 min read', tag: 'Governance' },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="badge badge-cyan text-xs">Route #11 • Research & Insights</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Perimeter Intelligence Journal
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Deep-dives on real-time neural acceleration, computer vision benchmarks, and industrial security automation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map(p => (
          <Link 
            key={p.slug} 
            to={`/blog/${p.slug}`}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <span className="badge badge-slate text-[10px]">{p.tag}</span>
              <h2 className="text-base font-bold text-white group-hover:text-cyan-300 transition leading-snug">{p.title}</h2>
              <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                <span>{p.date}</span>
                <span>•</span>
                <span>{p.readTime}</span>
              </div>
            </div>

            <div className="pt-2 text-xs font-mono text-cyan-400 font-bold flex items-center gap-1">
              <span>Read Technical Article</span>
              <ArrowRight size={13} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
