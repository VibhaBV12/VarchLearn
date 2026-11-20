import React, { useState } from 'react';
import {
  Eye,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Maximize2,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  VisualLearningData,
  VisualDiagramNode,
  VisualDiagramConnection,
} from '../../../shared/types';

export interface VisualDiagramNodeItem {
  id: string;
  label: string;
  role?: string;
  description?: string;
  x?: number;
  y?: number;
  color?: string;
  icon?: string;
}

export interface VisualDiagramConnectionItem {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
}

export interface VisualDiagramViewerProps {
  data?: VisualLearningData | null;
  /** Fallback properties if full VisualLearningData is not supplied */
  title?: string;
  description?: string;
  visualType?: 'annotated_diagram' | 'process_flow' | 'concept_map' | 'comparison_chart';
  nodes?: VisualDiagramNodeItem[] | VisualDiagramNode[];
  connections?: VisualDiagramConnectionItem[] | VisualDiagramConnection[];
  instructions?: string;
  inspectionTasks?: string[];
  challenge?: {
    prompt: string;
    targetNodeId: string;
    options: { id: string; label: string }[];
  };
  className?: string;
}

export const VisualDiagramViewer: React.FC<VisualDiagramViewerProps> = ({
  data,
  title: propTitle,
  description: propDescription,
  visualType: propVisualType,
  nodes: propNodes,
  connections: propConnections,
  instructions: propInstructions,
  inspectionTasks: propInspectionTasks,
  challenge: propChallenge,
  className = '',
}) => {
  // Resolve effective data from props or VisualLearningData
  const title = data?.title || propTitle || 'Interactive Visual Diagram';
  const description = data?.description || propDescription || 'Interactive structural model with inspection hotspots.';
  const visualType = data?.visualType || propVisualType || 'annotated_diagram';
  const instructions =
    data?.instructions ||
    propInstructions ||
    'Click on any glowing hotspot or node on the diagram to inspect its functional role.';
  const inspectionTasks = data?.inspectionTasks || propInspectionTasks || [];
  const challenge = data?.challenge || propChallenge;

  // Normalize nodes with defensive coordinates
  const rawNodes: any[] = data?.nodes || propNodes || [];
  const nodes: VisualDiagramNode[] = rawNodes.map((n, idx) => {
    // If coordinates missing, assign deterministic layout based on visualType
    let defaultX = 50;
    let defaultY = 50;
    if (visualType === 'process_flow') {
      defaultX = 15 + (idx * 70) / Math.max(1, rawNodes.length - 1);
      defaultY = 50;
    } else if (visualType === 'concept_map') {
      if (idx === 0) {
        defaultX = 50;
        defaultY = 50;
      } else {
        const angle = ((idx - 1) * 2 * Math.PI) / Math.max(1, rawNodes.length - 1);
        defaultX = 50 + 35 * Math.cos(angle);
        defaultY = 50 + 32 * Math.sin(angle);
      }
    } else if (visualType === 'comparison_chart') {
      defaultX = idx % 2 === 0 ? 30 : 70;
      defaultY = 25 + Math.floor(idx / 2) * 35;
    } else {
      // annotated_diagram default grid
      defaultX = 22 + (idx % 2) * 56;
      defaultY = 22 + Math.floor(idx / 2) * 48;
    }

    return {
      id: n.id || `node_${idx + 1}`,
      label: n.label || n.name || `Component ${idx + 1}`,
      role: n.role || (idx === 0 ? 'Primary Center' : 'Functional Unit'),
      description: n.description || 'Interconnected system element contributing to operational balance.',
      x: typeof n.x === 'number' && n.x >= 0 && n.x <= 100 ? n.x : defaultX,
      y: typeof n.y === 'number' && n.y >= 0 && n.y <= 100 ? n.y : defaultY,
      color: n.color || (idx === 0 ? '#7041C6' : idx === 1 ? '#0284C7' : idx === 2 ? '#059669' : '#D97706'),
    };
  });

  // Normalize connections
  const rawConns: any[] = data?.connections || propConnections || [];
  const connections: VisualDiagramConnection[] =
    rawConns.length > 0
      ? rawConns.map((c) => ({
          from: c.from || c.fromId || '',
          to: c.to || c.toId || '',
          label: c.label || '',
          style: c.style || 'solid',
        }))
      : nodes.length >= 2
      ? nodes.slice(0, nodes.length - 1).map((n, i) => ({
          from: n.id,
          to: nodes[i + 1].id,
          label: visualType === 'process_flow' ? 'flows to' : 'connects to',
          style: 'solid' as const,
        }))
      : [];

  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || '');
  const [inspectedIds, setInspectedIds] = useState<string[]>(nodes[0] ? [nodes[0].id] : []);
  const [challengeAnswer, setChallengeAnswer] = useState<string | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;

  const handleSelectNode = (node: VisualDiagramNode) => {
    setSelectedNodeId(node.id);
    if (!inspectedIds.includes(node.id)) {
      setInspectedIds((prev) => [...prev, node.id]);
    }
  };

  const handleChallengeSubmit = (optId: string) => {
    setChallengeAnswer(optId);
    if (challenge && optId === challenge.targetNodeId) {
      setChallengeFeedback('✓ Correct! This node represents the exact functional center identified in the curriculum.');
    } else {
      setChallengeFeedback('Not quite. Review the node descriptions on the diagram and try again.');
    }
  };

  // SVG coordinate transformation
  const svgWidth = 620;
  const svgHeight = 320;
  const toSvgX = (pct: number) => (pct / 100) * (svgWidth - 100) + 50;
  const toSvgY = (pct: number) => (pct / 100) * (svgHeight - 80) + 40;

  const typeLabels: Record<string, { label: string; badgeBg: string; badgeText: string }> = {
    annotated_diagram: { label: 'Annotated Diagram', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800' },
    process_flow: { label: 'Process Flowchart', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800' },
    concept_map: { label: 'Relational Concept Map', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800' },
    comparison_chart: { label: 'Comparative Chart', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800' },
  };

  const typeBadge = typeLabels[visualType] || typeLabels.annotated_diagram;

  return (
    <div className={`bg-white rounded-2xl border border-[#E2D6F8] shadow-sm overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="bg-[#FAF8FF] px-4 py-3 border-b border-[#E2D6F8] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7041C6]/10 flex items-center justify-center text-[#7041C6]">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-[#24163D] text-sm">{title}</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadge.badgeBg} ${typeBadge.badgeText}`}>
                {typeBadge.label}
              </span>
            </div>
            <p className="text-[11px] text-[#64587A]">{description}</p>
          </div>
        </div>

        {/* Inspection progress badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-[#7041C6] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Inspected {inspectedIds.length} of {nodes.length} hotspots
          </span>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className="relative bg-gradient-to-b from-[#FDFBFF] to-[#F7F3FC] p-3 flex flex-col items-center">
        {/* Helper instruction */}
        <div className="w-full max-w-xl text-center pb-2">
          <p className="text-[11px] font-semibold text-[#7041C6] flex items-center justify-center gap-1">
            <Info className="w-3 h-3" /> {instructions}
          </p>
        </div>

        {/* Dynamic SVG graphic */}
        <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E9E0FA] shadow-inner p-2 overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto max-h-[300px] select-none"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.03))' }}
          >
            <defs>
              {/* Arrow Marker */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#A855F7" />
              </marker>

              {/* Glowing Pulse Filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Pattern */}
            <g opacity="0.15">
              {Array.from({ length: 8 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * 80 + 30}
                  y1="10"
                  x2={i * 80 + 30}
                  y2={svgHeight - 10}
                  stroke="#7041C6"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                />
              ))}
              {Array.from({ length: 4 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1="10"
                  y1={i * 80 + 40}
                  x2={svgWidth - 10}
                  y2={i * 80 + 40}
                  stroke="#7041C6"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                />
              ))}
            </g>

            {/* Connection Lines & Flow Arrows */}
            {connections.map((conn, idx) => {
              const fromNode = nodes.find((n) => n.id === conn.from);
              const toNode = nodes.find((n) => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const x1 = toSvgX(fromNode.x);
              const y1 = toSvgY(fromNode.y);
              const x2 = toSvgX(toNode.x);
              const y2 = toSvgY(toNode.y);

              // Calculate midpoint for connection label
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g key={`conn-${idx}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#C084FC"
                    strokeWidth="2.5"
                    strokeDasharray={conn.style === 'dashed' ? '5 5' : undefined}
                    markerEnd="url(#arrowhead)"
                  />
                  {conn.label && (
                    <g transform={`translate(${midX}, ${midY - 8})`}>
                      <rect
                        x={-conn.label.length * 3.5 - 6}
                        y="-10"
                        width={conn.label.length * 7 + 12}
                        height="16"
                        rx="4"
                        fill="#FFFFFF"
                        stroke="#E2D6F8"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fill="#7041C6"
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="system-ui, sans-serif"
                      >
                        {conn.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Hotspots / Nodes */}
            {nodes.map((node) => {
              const cx = toSvgX(node.x);
              const cy = toSvgY(node.y);
              const isSelected = node.id === selectedNodeId;
              const isInspected = inspectedIds.includes(node.id);
              const themeColor = node.color || '#7041C6';

              return (
                <g
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  className="cursor-pointer transition-transform hover:scale-105"
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                >
                  {/* Outer pulse ring for selected node */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="26"
                      fill={themeColor}
                      opacity="0.25"
                      className="animate-pulse"
                    />
                  )}

                  {/* Hotspot background halo */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? '20' : '18'}
                    fill="#FFFFFF"
                    stroke={isSelected ? themeColor : isInspected ? '#10B981' : '#CBD5E1'}
                    strokeWidth={isSelected ? '3.5' : '2'}
                    filter="url(#glow)"
                  />

                  {/* Inner indicator dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? '10' : '8'}
                    fill={isInspected ? '#10B981' : themeColor}
                  />

                  {/* Checkmark or center dot */}
                  {isInspected ? (
                    <path
                      d={`M${cx - 3.5} ${cy} L${cx - 1} ${cy + 2.5} L${cx + 3.5} ${cy - 2.5}`}
                      stroke="#FFFFFF"
                      strokeWidth="1.6"
                      fill="none"
                      strokeLinecap="round"
                    />
                  ) : (
                    <circle cx={cx} cy={cy} r="3" fill="#FFFFFF" />
                  )}

                  {/* Node label box */}
                  <g transform={`translate(${cx}, ${cy + 24})`}>
                    <rect
                      x={-node.label.length * 3.8 - 8}
                      y="-8"
                      width={node.label.length * 7.6 + 16}
                      height="18"
                      rx="6"
                      fill={isSelected ? '#24163D' : '#FFFFFF'}
                      stroke={isSelected ? themeColor : '#E2D6F8'}
                      strokeWidth={isSelected ? '1.5' : '1'}
                      filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#24163D'}
                      fontSize="10"
                      fontWeight={isSelected ? '700' : '600'}
                      fontFamily="system-ui, sans-serif"
                    >
                      {node.label}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Detail Drawer for Selected Node */}
      {selectedNode && (
        <div className="p-4 bg-purple-50/60 border-t border-[#E2D6F8] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedNode.color || '#7041C6' }}
              />
              <h5 className="font-extrabold text-[#24163D] text-sm">
                {selectedNode.label}
              </h5>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#7041C6] border border-purple-200">
                {selectedNode.role}
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Inspector Target
            </span>
          </div>

          <p className="text-xs text-[#39245F] leading-relaxed">
            {selectedNode.description}
          </p>

          {/* Quick Hotspot Switcher Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-purple-100">
            <span className="text-[10px] font-bold text-[#64587A] mr-1">Switch Hotspot:</span>
            {nodes.map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelectNode(n)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                  n.id === selectedNode.id
                    ? 'bg-[#7041C6] text-white shadow-sm'
                    : 'bg-white border border-[#E2D6F8] text-[#39245F] hover:bg-purple-100'
                }`}
              >
                {n.label} {inspectedIds.includes(n.id) ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Challenge / Verification Task */}
      {challenge && challenge.options?.length > 0 && (
        <div className="p-4 bg-white border-t border-[#E2D6F8] space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#7041C6] text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Diagram Verification Challenge:
          </div>
          <p className="text-xs font-semibold text-[#24163D]">{challenge.prompt}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {challenge.options.map((opt) => {
              const isPicked = challengeAnswer === opt.id;
              const isCorrectTarget = opt.id === challenge.targetNodeId;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleChallengeSubmit(opt.id)}
                  className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                    isPicked
                      ? isCorrectTarget
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'bg-rose-50 border-rose-400 text-rose-900'
                      : 'bg-[#FAF8FF] border-[#E2D6F8] text-[#39245F] hover:bg-purple-50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {challengeFeedback && (
            <p
              className={`text-xs font-semibold pt-1 ${
                challengeFeedback.startsWith('✓') ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {challengeFeedback}
            </p>
          )}
        </div>
      )}

      {/* Inspection Tasks Checklist */}
      {inspectionTasks.length > 0 && (
        <div className="px-4 py-2.5 bg-[#FAF8FF] border-t border-[#E2D6F8] text-[11px] text-[#64587A] flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-bold text-[#39245F]">Learning Objectives:</span>
          {inspectionTasks.map((task, ti) => (
            <span key={ti} className="flex items-center gap-1">
              • {task}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
