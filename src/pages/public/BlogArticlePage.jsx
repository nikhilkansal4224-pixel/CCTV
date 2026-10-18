import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Share2, Shield } from 'lucide-react';

export default function BlogArticlePage() {
  const { slug = 'edge-ai-vs-cloud-video-latency' } = useParams();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-sans">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:underline">
        <ArrowLeft size={13} /> Back to Journal
      </Link>

      <div className="space-y-4">
        <span className="badge badge-cyan text-xs">Route #12 • In-Depth Analysis</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Edge AI vs. Cloud Video Latency: Why 15 Seconds Means the Robbery is Already Over
        </h1>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1 pb-4 border-b border-slate-800">
          <span>By Dr. Alexei Romanov, Head of Edge Vision</span>
          <span>•</span>
          <span>Published Oct 12, 2026</span>
          <span>•</span>
          <span>6 min read</span>
        </div>
      </div>

      <div className="prose prose-invert max-w-none text-slate-300 space-y-6 text-sm leading-relaxed">
        <p>
          In physical perimeter defense, time is measured not in minutes, but in milliseconds. An agile human intruder can scale a standard 2.4-meter commercial chainlink fence in approximately <strong>3.8 seconds</strong>. If your security architecture relies on encoding 4K video, pushing it over a WAN link to an AWS or Azure cloud datacenter, running YOLO inference, and then round-tripping the alert back to a security guard, you are operating with an inherent <strong>12 to 18-second blindspot</strong>.
        </p>

        <h2 className="text-xl font-bold text-white pt-4">The Latency Breakdown of Traditional Cloud CCTV</h2>
        <p>
          Let us trace the physics of a typical cloud surveillance packet:
        </p>
        <ul className="list-disc pl-5 space-y-2 font-mono text-xs text-slate-400">
          <li><strong>H.265 Keyframe Group of Pictures (GOP) buffering:</strong> 1,500ms – 2,000ms</li>
          <li><strong>Uplink Transmission over fiber / cellular:</strong> 200ms – 800ms</li>
          <li><strong>Cloud Ingestion & Decompression pipeline:</strong> 400ms – 1,200ms</li>
          <li><strong>Batch GPU Inference queue:</strong> 800ms – 3,500ms</li>
          <li><strong>Push notification dispatch to guard device:</strong> 2,000ms – 5,000ms</li>
        </ul>

        <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 font-mono text-xs text-cyan-300">
          <strong>The AEGIS Edge Architecture:</strong> Frame capture to TensorRT INT8 matrix tensor: 18.4 milliseconds. Direct hardware GPIO relay trigger: 12 milliseconds. Total acoustic deterrent actuation: under 200ms.
        </div>

        <h2 className="text-xl font-bold text-white pt-4">Conclusion</h2>
        <p>
          Autonomous security is fundamentally an edge problem. Cloud computing provides immense value for historical forensics and cold archival, but real-time physical perimeter defense requires local compute directly adjacent to the image sensor.
        </p>
      </div>
    </div>
  );
}
