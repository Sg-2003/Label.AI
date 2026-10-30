import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Task, LabelDefinition, BoundingBox, WorkerActionType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { storage } from '../../services/storage';
import { readableTextColor } from '../../utils/color';
import {
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Square,
  MousePointer,
  Trash2,
  CheckCircle2,
  SkipForward,
  Flag,
  HelpCircle,
  Clock,
  Layers,
  Eye,
  EyeOff,
  Move,
  Info,
  Check,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface CvatCanvasStudioProps {
  task: Task;
  labels: LabelDefinition[];
  onComplete: () => void;
  onSkip: () => void;
  onFlag: () => void;
  onOpenGuidelines: () => void;
}

type ToolMode = 'draw' | 'select' | 'pan';

export const CvatCanvasStudio: React.FC<CvatCanvasStudioProps> = ({
  task,
  labels,
  onComplete,
  onSkip,
  onFlag,
  onOpenGuidelines
}) => {
  const { currentUser, activeProject } = useAuth();
  const { submitAnnotation, recordTelemetry } = useRealtime();

  // Active label selected for newly drawn boxes
  const [activeLabel, setActiveLabel] = useState<LabelDefinition>(labels[0] || {
    id: 'l-default',
    name: 'Car',
    color: '#22c55e',
    shortcutKey: '1'
  });

  // Current boxes on the canvas
  const [boxes, setBoxes] = useState<BoundingBox[]>(() => {
    // If task already has annotations by user, load them, or start fresh
    return [];
  });

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('draw');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showAiBoxes, setShowAiBoxes] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<BoundingBox[][]>([]);
  const [taskStartTime] = useState<number>(Date.now());
  const [idleSeconds, setIdleSeconds] = useState<number>(0);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState<boolean>(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraftBox, setCurrentDraftBox] = useState<BoundingBox | null>(null);

  // Dragging / Resizing existing box
  const [isDraggingBox, setIsDraggingBox] = useState<boolean>(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'nw', 'ne', 'sw', 'se'
  const [dragStartMouse, setDragStartMouse] = useState<{ x: number; y: number } | null>(null);
  const [initialBoxRect, setInitialBoxRect] = useState<BoundingBox | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Telemetry logger helper
  const logAction = useCallback((action: WorkerActionType, details: string, duration?: number) => {
    if (!currentUser || !activeProject) return;
    recordTelemetry({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userAvatar: currentUser.avatar,
      projectId: activeProject.id,
      projectName: activeProject.name,
      taskId: task.id,
      action,
      details,
      durationSeconds: duration || Math.round((Date.now() - taskStartTime) / 1000)
    });
  }, [currentUser, activeProject, task.id, taskStartTime, recordTelemetry]);

  // Idle tracking: detect if annotator is not interacting for > 30s
  useEffect(() => {
    const idleTimer = setInterval(() => {
      setIdleSeconds(prev => {
        const next = prev + 1;
        if (next === 30) {
          logAction('idle_detected', `Annotator inactive for 30s on Task #${task.id.slice(-6)}`);
        }
        return next;
      });
    }, 1000);

    const resetIdle = () => setIdleSeconds(0);
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);

    return () => {
      clearInterval(idleTimer);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, [task.id, logAction]);

  // Push to undo stack before modifying boxes
  const pushUndo = (current: BoundingBox[]) => {
    setUndoStack(prev => [...prev.slice(-15), current]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(prevStack => prevStack.slice(0, -1));
    setBoxes(prev);
    setSelectedBoxId(null);
  };

  // Convert mouse event coordinates into percentage relative to image container
  const getRelativeCoordinates = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // Mouse Down handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (toolMode === 'pan') return;

    const coords = getRelativeCoordinates(e);

    // If clicking a resize handle (handled by handleResizeMouseDown), don't start new box
    if (resizeHandle) return;

    if (toolMode === 'draw') {
      setIsDrawing(true);
      setDrawStart(coords);
      setCurrentDraftBox({
        id: `draft-${Date.now()}`,
        label: activeLabel.name,
        color: activeLabel.color,
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        source: 'human'
      });
    }
  };

  // Mouse Move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getRelativeCoordinates(e);

    if (isDrawing && drawStart && currentDraftBox) {
      const minX = Math.min(drawStart.x, coords.x);
      const minY = Math.min(drawStart.y, coords.y);
      const width = Math.abs(coords.x - drawStart.x);
      const height = Math.abs(coords.y - drawStart.y);

      setCurrentDraftBox({
        ...currentDraftBox,
        x: minX,
        y: minY,
        width,
        height
      });
      return;
    }

    // Resizing selected box
    if (resizeHandle && selectedBoxId && dragStartMouse && initialBoxRect) {
      const deltaX = coords.x - dragStartMouse.x;
      const deltaY = coords.y - dragStartMouse.y;

      setBoxes(prev => prev.map(b => {
        if (b.id !== selectedBoxId) return b;
        let newX = initialBoxRect.x;
        let newY = initialBoxRect.y;
        let newW = initialBoxRect.width;
        let newH = initialBoxRect.height;

        if (resizeHandle.includes('e')) newW = Math.max(2, initialBoxRect.width + deltaX);
        if (resizeHandle.includes('s')) newH = Math.max(2, initialBoxRect.height + deltaY);
        if (resizeHandle.includes('w')) {
          const possibleW = initialBoxRect.width - deltaX;
          if (possibleW > 2) {
            newX = initialBoxRect.x + deltaX;
            newW = possibleW;
          }
        }
        if (resizeHandle.includes('n')) {
          const possibleH = initialBoxRect.height - deltaY;
          if (possibleH > 2) {
            newY = initialBoxRect.y + deltaY;
            newH = possibleH;
          }
        }

        return { ...b, x: newX, y: newY, width: newW, height: newH };
      }));
      return;
    }

    // Dragging whole box
    if (isDraggingBox && selectedBoxId && dragStartMouse && initialBoxRect) {
      const deltaX = coords.x - dragStartMouse.x;
      const deltaY = coords.y - dragStartMouse.y;

      setBoxes(prev => prev.map(b => {
        if (b.id !== selectedBoxId) return b;
        return {
          ...b,
          x: Math.max(0, Math.min(100 - b.width, initialBoxRect.x + deltaX)),
          y: Math.max(0, Math.min(100 - b.height, initialBoxRect.y + deltaY))
        };
      }));
    }
  };

  // Mouse Up handler
  const handleMouseUp = () => {
    if (isDrawing && currentDraftBox) {
      // Only keep box if width and height are meaningful (> 1.5%)
      if (currentDraftBox.width >= 1.5 && currentDraftBox.height >= 1.5) {
        pushUndo(boxes);
        const newBox: BoundingBox = {
          ...currentDraftBox,
          id: `box-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        };
        const updated = [...boxes, newBox];
        setBoxes(updated);
        setSelectedBoxId(newBox.id);

        logAction('box_created', `Added [${newBox.label}] bbox at (${newBox.x.toFixed(1)}%, ${newBox.y.toFixed(1)}%)`);
      }
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentDraftBox(null);
    }

    if (resizeHandle) {
      setResizeHandle(null);
      setDragStartMouse(null);
      setInitialBoxRect(null);
      logAction('box_resized', `Resized box #${selectedBoxId?.slice(-4)}`);
    }

    if (isDraggingBox) {
      setIsDraggingBox(false);
      setDragStartMouse(null);
      setInitialBoxRect(null);
    }
  };

  // Delete selected box
  const handleDeleteSelected = () => {
    if (!selectedBoxId) return;
    pushUndo(boxes);
    const boxToDelete = boxes.find(b => b.id === selectedBoxId);
    setBoxes(prev => prev.filter(b => b.id !== selectedBoxId));
    setSelectedBoxId(null);

    if (boxToDelete) {
      logAction('box_deleted', `Deleted bbox [${boxToDelete.label}]`);
    }
  };

  // Change class of selected box
  const handleChangeSelectedClass = (labelDef: LabelDefinition) => {
    if (!selectedBoxId) return;
    pushUndo(boxes);
    setBoxes(prev => prev.map(b => {
      if (b.id === selectedBoxId) {
        return { ...b, label: labelDef.name, color: labelDef.color };
      }
      return b;
    }));
    logAction('label_assigned', `Changed box #${selectedBoxId.slice(-4)} label to "${labelDef.name}"`);
  };

  // 1-Click Accept All AI predictions (CVAT / JEBI style AI assist)
  const handleAcceptAllAiBoxes = () => {
    if (!task.aiSuggestion?.boxes || task.aiSuggestion.boxes.length === 0) return;
    pushUndo(boxes);

    const aiBoxes: BoundingBox[] = task.aiSuggestion.boxes.map(b => {
      const matched = labels.find(l => l.name.toLowerCase() === b.label.toLowerCase());
      return {
        ...b,
        id: `ai-accepted-${Date.now()}-${b.id}`,
        color: matched?.color || '#3b82f6',
        source: 'ai'
      };
    });

    setBoxes(prev => [...prev, ...aiBoxes]);
    logAction('ai_accepted', `Accepted ${aiBoxes.length} Gemini 2.5 Flash predicted bounding boxes`);
  };

  // Accept single AI box
  const handleAcceptSingleAiBox = (aiBox: BoundingBox) => {
    pushUndo(boxes);
    const matched = labels.find(l => l.name.toLowerCase() === aiBox.label.toLowerCase());
    const newBox: BoundingBox = {
      ...aiBox,
      id: `ai-accepted-${Date.now()}-${aiBox.id}`,
      color: matched?.color || '#3b82f6',
      source: 'ai'
    };
    setBoxes(prev => [...prev, newBox]);
    logAction('ai_accepted', `Accepted AI predicted box for [${aiBox.label}] (${aiBox.confidence ? Math.round(aiBox.confidence * 100) : 90}%)`);
  };

  // Submit Task with all Bounding Boxes
  const handleSaveAndSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const timeTaken = Math.max(1, Math.round((Date.now() - taskStartTime) / 1000));
    const primaryLabel = boxes.length > 0 ? boxes[0].label : (labels[0]?.name || 'Car');

    setTimeout(() => {
      try {
        submitAnnotation(
          task.id,
          currentUser.id,
          primaryLabel,
          timeTaken,
          `Annotated ${boxes.length} bounding boxes`,
          boxes
        );
        onComplete();
      } catch (err) {
        console.error('Failed to submit CVAT task:', err);
      } finally {
        setIsSubmitting(false);
      }
    }, 200);
  };

  // Keyboard Shortcuts (CVAT Standard: B for box, V for pointer, Del for delete, 1-9 for classes)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setToolMode('draw');
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setToolMode('select');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setToolMode('pan');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBoxId) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedBoxId(null);
        setIsDrawing(false);
        setCurrentDraftBox(null);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndSubmit();
      } else {
        // Number keys 1-9 for label selection
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= labels.length) {
          e.preventDefault();
          const target = labels[num - 1];
          setActiveLabel(target);
          if (selectedBoxId) {
            handleChangeSelectedClass(target);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [labels, selectedBoxId, boxes, undoStack, isSubmitting]);

  // Selected box object
  const selectedBox = boxes.find(b => b.id === selectedBoxId);

  return (
    <div className="bg-slate-900 text-slate-100 min-h-[calc(100vh-4rem)] flex flex-col select-none">
      
      {/* Top Header Bar: Task info, AI assist quick action, and status */}
      <div className="h-14 border-b border-slate-800 bg-slate-950/80 px-4 flex items-center justify-between gap-4">
        
        {/* Left: Task ID & Gold badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-bold text-slate-400">TASK #{task.id.slice(-6).toUpperCase()}</span>
          </div>

          <span className="text-slate-600">|</span>

          <span className="text-xs text-slate-300 font-medium truncate max-w-xs md:max-w-md">
            {task.data.text || 'Autonomous Road Perception Frame'}
          </span>

          {task.isGold && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <ShieldCheck className="w-3 h-3" />
              Benchmark Frame
            </span>
          )}

          {idleSeconds >= 30 && (
            <span className="text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded animate-pulse">
              Idle {idleSeconds}s
            </span>
          )}
        </div>

        {/* Center: AI Assist 1-Click Action */}
        {task.aiSuggestion && task.aiSuggestion.boxes && task.aiSuggestion.boxes.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-indigo-950/70 border border-indigo-700/60 rounded-xl px-3 py-1 text-xs">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-200">
              Gemini predicted <strong className="text-white font-semibold">{task.aiSuggestion.boxes.length} bounding boxes</strong>
            </span>
            <button
              onClick={handleAcceptAllAiBoxes}
              className="ml-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-sm transition-all flex items-center gap-1 active:scale-95"
            >
              <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
              Accept All AI Boxes
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGuidelines}
            className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="View Guidelines (G)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Guidelines</span>
          </button>

          <button
            onClick={onSkip}
            className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Skip (S)"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Skip</span>
          </button>

          <button
            onClick={onFlag}
            className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Flag Task (F)"
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Flag</span>
          </button>

          <button
            onClick={handleSaveAndSubmit}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Next (Enter)</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: Left CVAT Tools, Center Canvas, Right Object List */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Toolbar: CVAT / JEBI Standard Tools */}
        <aside className="w-14 border-r border-slate-800 bg-slate-950 flex flex-col items-center py-3 gap-2">
          {/* Tool: Draw Box */}
          <button
            onClick={() => setToolMode('draw')}
            title="Draw Bounding Box (B)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              toolMode === 'draw'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Square className="w-5 h-5" />
          </button>

          {/* Tool: Select/Edit Box */}
          <button
            onClick={() => setToolMode('select')}
            title="Select & Transform Box (V)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              toolMode === 'select'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <MousePointer className="w-5 h-5" />
          </button>

          {/* Tool: Pan */}
          <button
            onClick={() => setToolMode('pan')}
            title="Pan Viewport (P)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              toolMode === 'pan'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Move className="w-5 h-5" />
          </button>

          <div className="w-6 h-px bg-slate-800 my-1" />

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Delete Selected */}
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedBoxId}
            title="Delete Selected Box (Del)"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-slate-800 my-1" />

          {/* Toggle AI suggestions visibility */}
          <button
            onClick={() => setShowAiBoxes(!showAiBoxes)}
            title={showAiBoxes ? 'Hide AI Predictions' : 'Show AI Predictions'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              showAiBoxes ? 'text-indigo-400 bg-indigo-950/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {showAiBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </aside>

        {/* Center: Canvas Workspace */}
        <div className="flex-1 flex flex-col bg-slate-900/90 relative overflow-hidden">
          
          {/* Active Class Selection Bar (CVAT Top Strip) */}
          <div className="h-11 border-b border-slate-800 bg-slate-950/40 px-4 flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Class:
              </span>
              {labels.map((lbl, idx) => {
                const isCurrent = activeLabel.id === lbl.id;
                return (
                  <button
                    key={lbl.id}
                    onClick={() => {
                      setActiveLabel(lbl);
                      if (selectedBoxId) handleChangeSelectedClass(lbl);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                      isCurrent
                        ? 'border-white/40 shadow-sm'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    style={{
                      backgroundColor: isCurrent ? `${lbl.color}25` : undefined,
                      color: isCurrent ? lbl.color : undefined
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: lbl.color }}
                    />
                    <span>{lbl.name}</span>
                    <span className="text-[10px] opacity-60 font-mono">[{lbl.shortcutKey || idx + 1}]</span>
                  </button>
                );
              })}
            </div>

            {/* Canvas Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => {
                  setZoomLevel(prev => Math.max(0.5, prev - 0.25));
                  logAction('canvas_zoom', `Zoomed out to ${(zoomLevel - 0.25).toFixed(2)}x`);
                }}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:bg-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-300 min-w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => {
                  setZoomLevel(prev => Math.min(3, prev + 0.25));
                  logAction('canvas_zoom', `Zoomed in to ${(zoomLevel + 0.25).toFixed(2)}x`);
                }}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:bg-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-slate-700"
                title="Reset Zoom & Pan"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Image Canvas Viewport */}
          <div
            className={`flex-1 relative flex items-center justify-center p-4 overflow-hidden ${
              toolMode === 'draw' ? 'cursor-crosshair' : toolMode === 'pan' ? 'cursor-grab' : 'cursor-default'
            }`}
            onMouseEnter={() => setIsHoveringCanvas(true)}
            onMouseLeave={() => setIsHoveringCanvas(false)}
          >
            {/* Scaled/Panned Container */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="relative max-w-full max-h-[75vh] shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-black flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center center',
                transition: isDrawing || resizeHandle || isDraggingBox ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              {/* Target Image */}
              <img
                ref={imageRef}
                src={task.data.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200'}
                alt="Annotation frame"
                className="max-h-[72vh] w-auto object-contain block pointer-events-none select-none"
                draggable={false}
              />

              {/* Render Existing Human Bounding Boxes */}
              {boxes.map((box) => {
                const isSelected = box.id === selectedBoxId;
                const matchedLabel = labels.find(l => l.name.toLowerCase() === box.label.toLowerCase());
                const boxColor = box.color || matchedLabel?.color || '#22c55e';

                return (
                  <div
                    key={box.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBoxId(box.id);
                    }}
                    onMouseDown={(e) => {
                      if (toolMode === 'select') {
                        e.stopPropagation();
                        setSelectedBoxId(box.id);
                        setIsDraggingBox(true);
                        setDragStartMouse(getRelativeCoordinates(e));
                        setInitialBoxRect({ ...box });
                      }
                    }}
                    className={`absolute transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-black z-20'
                        : 'hover:ring-1 hover:ring-white/80 z-10'
                    }`}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      border: `2px solid ${boxColor}`,
                      backgroundColor: `${boxColor}20`,
                      cursor: toolMode === 'select' ? 'move' : 'pointer'
                    }}
                  >
                    {/* Label Tag on Top of Box */}
                    <div
                      className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight shadow-md flex items-center gap-1 whitespace-nowrap"
                      style={{
                        backgroundColor: boxColor,
                        color: readableTextColor(boxColor)
                      }}
                    >
                      <span>{box.label}</span>
                      {box.source === 'ai' && (
                        <span className="opacity-80 text-[9px] uppercase font-mono">AI</span>
                      )}
                    </div>

                    {/* Resize Handles (rendered when selected) */}
                    {isSelected && (
                      <>
                        {['nw', 'ne', 'sw', 'se'].map(handle => {
                          const isTop = handle.includes('n');
                          const isLeft = handle.includes('w');
                          return (
                            <div
                              key={handle}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setResizeHandle(handle);
                                setDragStartMouse(getRelativeCoordinates(e));
                                setInitialBoxRect({ ...box });
                              }}
                              className="w-2.5 h-2.5 bg-white border border-black absolute z-30"
                              style={{
                                top: isTop ? '-5px' : 'calc(100% - 5px)',
                                left: isLeft ? '-5px' : 'calc(100% - 5px)',
                                cursor: `${handle}-resize`
                              }}
                            />
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Render AI Pre-Predicted Bounding Boxes (Dashed lines) */}
              {showAiBoxes && task.aiSuggestion?.boxes && task.aiSuggestion.boxes.map((aiBox) => {
                // If user has already drawn or accepted this box, don't duplicate
                const alreadyAccepted = boxes.some(
                  b => Math.abs(b.x - aiBox.x) < 2 && Math.abs(b.y - aiBox.y) < 2
                );
                if (alreadyAccepted) return null;

                const matchedLabel = labels.find(l => l.name.toLowerCase() === aiBox.label.toLowerCase());
                const boxColor = matchedLabel?.color || '#3b82f6';

                return (
                  <div
                    key={`ai-${aiBox.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptSingleAiBox(aiBox);
                    }}
                    className="absolute border-2 border-dashed z-5 group cursor-pointer hover:bg-indigo-500/20 transition-colors"
                    style={{
                      left: `${aiBox.x}%`,
                      top: `${aiBox.y}%`,
                      width: `${aiBox.width}%`,
                      height: `${aiBox.height}%`,
                      borderColor: boxColor,
                      backgroundColor: `${boxColor}10`
                    }}
                    title="AI Candidate: Click to accept box"
                  >
                    <div
                      className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-md flex items-center gap-1 bg-indigo-900/90 text-indigo-200 border border-indigo-700"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                      <span>{aiBox.label}</span>
                      <span className="font-mono text-[9px] text-indigo-300">
                        {aiBox.confidence ? Math.round(aiBox.confidence * 100) : 90}%
                      </span>
                    </div>

                    <div className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-black/40 text-white text-[11px] font-bold">
                      Click to Accept
                    </div>
                  </div>
                );
              })}

              {/* Currently Drawing Draft Box */}
              {isDrawing && currentDraftBox && (
                <div
                  className="absolute pointer-events-none z-30"
                  style={{
                    left: `${currentDraftBox.x}%`,
                    top: `${currentDraftBox.y}%`,
                    width: `${currentDraftBox.width}%`,
                    height: `${currentDraftBox.height}%`,
                    border: `2px dashed ${activeLabel.color}`,
                    backgroundColor: `${activeLabel.color}30`
                  }}
                >
                  <div
                    className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-md"
                    style={{
                      backgroundColor: activeLabel.color,
                      color: readableTextColor(activeLabel.color)
                    }}
                  >
                    {activeLabel.name}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Canvas Status Bar */}
          <div className="h-8 border-t border-slate-800 bg-slate-950 px-4 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-4">
              <span>Tool: <strong className="text-slate-200 uppercase">{toolMode}</strong></span>
              <span>•</span>
              <span>Total Boxes: <strong className="text-emerald-400">{boxes.length}</strong></span>
              {selectedBox && (
                <>
                  <span>•</span>
                  <span>
                    Selected: <strong className="text-indigo-300">{selectedBox.label}</strong> [{Math.round(selectedBox.width)}% × {Math.round(selectedBox.height)}%]
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500">Shortcuts: [B] Box | [V] Select | [Del] Remove | [1-5] Class | [Enter] Next</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Objects / Bounding Boxes List */}
        <aside className="w-72 border-l border-slate-800 bg-slate-950 flex flex-col">
          
          {/* Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Objects ({boxes.length})
              </span>
            </div>

            {boxes.length > 0 && (
              <button
                onClick={() => {
                  pushUndo(boxes);
                  setBoxes([]);
                  setSelectedBoxId(null);
                  logAction('box_deleted', `Cleared all ${boxes.length} bounding boxes`);
                }}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Box List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {boxes.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Square className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No boxes drawn yet.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Drag on the frame or click AI suggestions to add bounding boxes.
                </p>
              </div>
            ) : (
              boxes.map((b, index) => {
                const isSelected = b.id === selectedBoxId;
                const matched = labels.find(l => l.name.toLowerCase() === b.label.toLowerCase());
                const color = b.color || matched?.color || '#22c55e';

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBoxId(b.id)}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500/80 bg-indigo-950/40 shadow-xs'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="truncate">
                        <span className="font-bold text-slate-200">{b.label}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                          #{index + 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {b.source === 'ai' && (
                        <span className="text-[9px] font-bold px-1 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                          AI
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBoxId(b.id);
                          handleDeleteSelected();
                        }}
                        className="w-5 h-5 rounded hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors"
                        title="Delete box"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* AI Candidates List */}
            {task.aiSuggestion?.boxes && task.aiSuggestion.boxes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="px-1 mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Predictions
                  </span>
                  <button
                    onClick={handleAcceptAllAiBoxes}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Accept All
                  </button>
                </div>

                <div className="space-y-1">
                  {task.aiSuggestion.boxes.map((aiBox) => (
                    <div
                      key={`list-ai-${aiBox.id}`}
                      onClick={() => handleAcceptSingleAiBox(aiBox)}
                      className="p-1.5 rounded-lg border border-dashed border-indigo-800/80 hover:border-indigo-600 bg-indigo-950/20 text-xs flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-300 font-medium">{aiBox.label}</span>
                        <span className="text-[10px] font-mono text-indigo-400">
                          {aiBox.confidence ? Math.round(aiBox.confidence * 100) : 90}%
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-400 group-hover:text-white transition-colors">
                        + Add
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Submit Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            <button
              onClick={handleSaveAndSubmit}
              disabled={isSubmitting}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Save & Next Task (Enter)</span>
            </button>
          </div>

        </aside>
      </div>

    </div>
  );
};
