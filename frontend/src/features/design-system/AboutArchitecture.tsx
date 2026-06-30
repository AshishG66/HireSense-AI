
import {
  Server,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  Code
} from 'lucide-react';

export default function AboutArchitecture() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent font-display">
          System Architecture & Design
        </h1>
        <p className="text-muted-foreground mt-2">
          Deep-dive into the architectural patterns, request cycles, and database relationships of HireSense AI.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Architecture Pattern', value: 'Clean Architecture', desc: 'SOLID separated layers', icon: Layers },
          { label: 'AI LLM Engine', value: 'Gemini 2.5 Flash', desc: 'Context-aware prompts', icon: Cpu },
          { label: 'Relational Database', value: 'PostgreSQL 15', desc: 'Structured schema mappings', icon: Database },
          { label: 'Service Containers', value: 'Multi-Stage Docker', desc: 'Secure Nginx/Node envs', icon: Server }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-lg font-bold">{stat.value}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual System Flowchart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" /> API Request & Traffic Lifecycle
        </h2>
        
        {/* Flow Blocks */}
        <div className="grid gap-6 md:grid-cols-5 items-center">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
            <span className="text-xs text-indigo-400 font-bold block mb-1">INGRESS</span>
            <span className="font-bold text-sm text-slate-100">Nginx Reverse Proxy</span>
            <p className="text-xs text-slate-400 mt-1">Routes frontend static assets & backend routes</p>
          </div>
          <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-slate-500 rotate-90 md:rotate-0" /></div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
            <span className="text-xs text-emerald-400 font-bold block mb-1">BUSINESS CORE</span>
            <span className="font-bold text-sm text-slate-100">Express Application</span>
            <p className="text-xs text-slate-400 mt-1">Authenticates users, validation, locks guards</p>
          </div>
          <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-slate-500 rotate-90 md:rotate-0" /></div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
            <span className="text-xs text-amber-400 font-bold block mb-1">INTELLIGENCE</span>
            <span className="font-bold text-sm text-slate-100">FastAPI AI Copilot</span>
            <p className="text-xs text-slate-400 mt-1">Evaluates codes & resume alignment metrics</p>
          </div>
        </div>
      </div>

      {/* Database Schema Map */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" /> Database Mappings (ER Model)
          </h2>
          <p className="text-sm text-muted-foreground">
            The PostgreSQL relational schemas are split into core transactional blocks to optimize querying latency.
          </p>
          <div className="space-y-3">
            {[
              { entity: 'User', fields: 'id, email, password, role, createdAt' },
              { entity: 'CandidateProfile', fields: 'id, userId, fullName, skills, experienceYears' },
              { entity: 'Resume', fields: 'id, candidateId, title, fileUrl, activeVersion' },
              { entity: 'InterviewSession', fields: 'id, candidateId, difficulty, score, feedback' },
              { entity: 'CodingQuestion', fields: 'id, title, difficulty, solutionTemplate' }
            ].map((ent, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                <span className="font-semibold text-slate-200">{ent.entity}</span>
                <span className="text-xs text-muted-foreground truncate max-w-xs">{ent.fields}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Reliability */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-400" /> Security Controls & Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">
            HireSense AI implements enterprise safety constraints protecting database access logs and request rates.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span><strong>Rate Limiter</strong>: Locks access thresholds to prevent API spam attacks.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span><strong>Helmet Headers</strong>: Enforces strict Content-Security-Policies.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span><strong>Daily Rotate Logger</strong>: Separates runtime application messages and error traces.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span><strong>Correlation IDs</strong>: Correlates backend Express server logs to track failures.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Raw Mermaid Specs */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" /> Mermaid Diagram Specifications
          </h2>
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">
          Copy the Mermaid code below to render the platforms diagram mappings in any markdown editor.
        </p>
        <pre className="bg-slate-950 border border-slate-900 rounded-lg p-4 text-xs overflow-x-auto text-emerald-400 font-mono">
{`graph TD
    UserBrowser[Candidate / Recruiter Web App] -->|HTTPS Port 80/3000| Nginx[Nginx Reverse Proxy]
    Nginx -->|React SPA Client| UserBrowser
    
    UserBrowser -->|Rest HTTP Calls Port 5000| Express[Node.js Express Backend]
    Express -->|Prisma Client| DB[(PostgreSQL Database)]
    Express -->|Background Processing| WorkQueue[In-Memory Queue Service]
    Express -->|POST /review /evaluate| FastAPI[Python FastAPI AI-Service]
    
    FastAPI -->|Google GenAI SDK| Gemini[Gemini 2.5 LLM Engine]`}
        </pre>
      </div>
    </div>
  );
}
