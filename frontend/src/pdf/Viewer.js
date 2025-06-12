import React, { useEffect, useState, useRef } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faTrash, faEdit, faQuestion, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { Rnd } from "react-rnd";
import Tesseract from "tesseract.js";
 
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
 
const Viewer = ({
  pageNum,
  onPageChange,
  onLoadSuccess,
  annotations,
  onClick,
  onFreehandDraw,
  selectedTool,
  file,
  pdfId,
  onEditingChange,
  onSaveCopy,
  onGetSavedPdf,
  onGetOriginalPdf,
  toggleRightSidebar,
  onUpdateMarks,
  zoomScale,
  setZoomScale,
  valuationMode,
  setValuationMode,
}) => {
  const [totalPages, setTotalPages] = useState(0);
  const pageRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [docIsOpen, setDocIsOpen] = useState(true);
  const [markDocIsOpen, setMarkDocIsOpen] = useState(true);
  const [isErasing, setIsErasing] = useState(false);
  const [drawingDigitAnnotation, setDrawingDigitAnnotation] = useState(null);
  const [penOpacity, setPenOpacity] = useState(1);
  const [penSize, setPenSize] = useState(2);
  const [penColor, setPenColor] = useState("#FF0000");
  const [isPdfDropdownMenuOpen, setIsPdfDropdownMenuOpen] = useState(false);
  const [isValDropdownMenuOpen, setIsValDropdownMenuOpen] = useState(false);
 
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(!!isEditing);
    }
  }, [isEditing, onEditingChange]);
 
  const handleSaveCopyClick = (e) => {
    e.stopPropagation();
 
    onSaveCopy?.();
    setIsPdfDropdownMenuOpen(false);
  };
 
  const handleGetSavedPdfClick = (e) => {
    e.stopPropagation();
   
    onGetSavedPdf?.();
    setIsPdfDropdownMenuOpen(false);
  };
 
  const handleGetOriginalPdfClick = (e) => {
    e.stopPropagation();
    
    onGetOriginalPdf?.();
    setIsPdfDropdownMenuOpen(false);
  };
 
  const handleValuationSwitch = (mode) => (e) => {
    e.stopPropagation();

    setValuationMode(mode);
    setIsValDropdownMenuOpen(false);
  };
 
  const togglePdfDropdownMenu = (e) => {
    e.stopPropagation();
   
    setIsPdfDropdownMenuOpen((prev) => {
     
      return !prev;
    });
    setIsValDropdownMenuOpen(false);
  };
 
  const toggleValDropdownMenu = (e) => {
    e.stopPropagation();
  
    setIsValDropdownMenuOpen((prev) => {
      
      return !prev;
    });
    setIsPdfDropdownMenuOpen(false);
  };
 
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.1, 0.5));
 
  const pdfFile = file;
 
  function onDocLoad(event) {
    setTotalPages(event.numPages);
    onLoadSuccess?.(event.numPages);
  }
 
  const changePage = (param) => {
    let newPage;
    if (typeof param === "number") newPage = param;
    else if (param === "prev") newPage = Math.max(pageNum - 1, 1);
    else if (param === "next") newPage = Math.min(pageNum + 1, totalPages);
    if (newPage && onPageChange) onPageChange(newPage);
  };
 
  const startDrawing = (e) => {
    if (selectedTool === "pen" && !isEditing) {
      setIsDrawing(true);
      const rect = pageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath([{ x: x / zoomScale, y: y / zoomScale, opacity: penOpacity, size: penSize, color: penColor }]);
    } else if (selectedTool === "digitPen" && !isEditing) {
      const rect = pageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoomScale;
      const y = (e.clientY - rect.top) / zoomScale;
      setDrawingDigitAnnotation({
        x,
        y,
        width: 200,
        height: 400,
        paths: [{ x: 100, y: 200 }],
        originX: x,
        originY: y,
      });
    }
  };
 
  const draw = (e) => {
    if (isDrawing && pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath((prev) => [...prev, { x: x / zoomScale, y: y / zoomScale, opacity: penOpacity, size: penSize, color: penColor }]);
    } else if (drawingDigitAnnotation && pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoomScale;
      const y = (e.clientY - rect.top) / zoomScale;
      const deltaX = x - drawingDigitAnnotation.originX;
      const deltaY = y - drawingDigitAnnotation.originY;
      setDrawingDigitAnnotation((prev) => ({
        ...prev,
        paths: [...prev.paths, { x: 100 + deltaX, y: 200 + deltaY }],
      }));
    }
  };
 
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentPath.length > 1) {
        onFreehandDraw(currentPath);
      }
      setCurrentPath([]);
    } else if (drawingDigitAnnotation) {
      setTimeout(() => {
        recognizeDigit(drawingDigitAnnotation).then((recognizedDigit) => {
          if (recognizedDigit !== null) {
            const newAnnotation = {
              type: "text",
              text: recognizedDigit.toString(),
              x: drawingDigitAnnotation.originX,
              y: drawingDigitAnnotation.originY,
              width: 30,
              height: 30,
              size: 20,
              color: "#FF0000",
              fontWeight: "bold",
              page: pageNum,
              pdfId,
              id: Date.now().toString(),
            };
            onClick(newAnnotation);
           
          }
          setDrawingDigitAnnotation(null);
        });
      }, 100);
    }
  };
 
  const recognizeDigit = async (annotation) => {
    try {
      const digitCanvas = document.createElement("canvas");
      digitCanvas.width = annotation.width * zoomScale;
      digitCanvas.height = annotation.height * zoomScale;
      const digitCtx = digitCanvas.getContext("2d");
      digitCtx.fillStyle = "white";
      digitCtx.fillRect(0, 0, digitCanvas.width, digitCanvas.height);
      digitCtx.strokeStyle = "black";
      digitCtx.lineWidth = 4 * zoomScale;
      digitCtx.beginPath();
      annotation.paths.forEach((point, index) => {
        const x = point.x * zoomScale;
        const y = point.y * zoomScale;
        if (index === 0) digitCtx.moveTo(x, y);
        else digitCtx.lineTo(x, y);
      });
      digitCtx.stroke();
 
      const { data } = await Tesseract.recognize(digitCanvas.toDataURL(), "eng", {
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: "10",
      });
 
      const digit = data.text.trim();
      if (/^[0-9]$/.test(digit)) {
        return parseInt(digit, 10);
      }
      return null;
    } catch (error) {
      console.error("OCR Error:", error);
      return null;
    }
  };
 
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
 
      annotations
        .filter((anno) => anno.type === "pen" && anno.page === pageNum)
        .forEach((anno) => {
          context.beginPath();
          anno.path.forEach((point, index) => {
            const x = point.x * zoomScale;
            const y = point.y * zoomScale;
            context.strokeStyle = point.color || "#FF0000";
            context.lineWidth = (point.size || 2) * zoomScale;
            context.globalAlpha = point.opacity !== undefined ? point.opacity : 1;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          });
          context.stroke();
        });
 
      if (isDrawing && currentPath.length > 1) {
        context.beginPath();
        currentPath.forEach((point, index) => {
          const x = point.x * zoomScale;
          const y = point.y * zoomScale;
          context.strokeStyle = penColor;
          context.lineWidth = penSize * zoomScale;
          context.globalAlpha = penOpacity;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      }
 
      if (drawingDigitAnnotation) {
        context.strokeStyle = "blue";
        context.lineWidth = 4 * zoomScale;
        context.globalAlpha = 1;
        context.beginPath();
        drawingDigitAnnotation.paths.forEach((point, index) => {
          const x = (drawingDigitAnnotation.originX + (point.x - 100)) * zoomScale;
          const y = (drawingDigitAnnotation.originY + (point.y - 200)) * zoomScale;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      }
    }
  }, [isDrawing, currentPath, drawingDigitAnnotation, annotations, zoomScale, pageNum, penOpacity, penSize, penColor]);
 
  const erase = (e) => {
    if (!isErasing || !pageRef.current) return;
    eraseAtPoint(e);
  };
 
  const startErasing = (e) => {
    if (selectedTool !== "eraser" || !pageRef.current || isEditing) return;
    setIsErasing(true);
    eraseAtPoint(e);
  };
 
  const stopErasing = () => {
    if (isErasing) {
      setIsErasing(false);
    }
  };
 
  const eraseAtPoint = (e) => {
    const rect = pageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomScale;
    const y = (e.clientY - rect.top) / zoomScale;
    const eraserRadius = 10;
 
    const penAnnotations = annotations.filter(
      (anno) => anno.type === "pen" && anno.page === pageNum && anno.pdfId === pdfId
    );
 
    penAnnotations.forEach((anno) => {
      const path = anno.path;
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        if (pointIntersectsLine(x, y, p1.x, p1.y, p2.x, p2.y, eraserRadius)) {
          onClick({ type: "delete", id: anno.id });
          break;
        }
      }
    });
 
    const otherAnnotations = annotations.filter(
      (anno) =>
        (anno.type === "mark" ||
         anno.type === "check" ||
         anno.type === "times" ||
         anno.type === "trash" ||
         anno.type === "question" ||
         anno.type === "text") &&
        anno.page === pageNum &&
        anno.pdfId === pdfId
    );
 
    otherAnnotations.forEach((anno) => {
      const dx = x - anno.x;
      const dy = y - anno.y;
      if (Math.sqrt(dx * dx + dy * dy) < eraserRadius) {
        onClick({ type: "delete", id: anno.id });
      }
    });
  };
 
  const pointIntersectsLine = (px, py, x1, y1, x2, y2, radius) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;
 
    const t = ((px - x1) * dx + (py - y1) * dy) / (len * len);
    const clampedT = Math.max(0, Math.min(1, t));
    const closestX = x1 + clampedT * dx;
    const closestY = y1 + clampedT * dy;
 
    const distX = px - closestX;
    const distY = py - closestY;
    const distance = Math.sqrt(distX * distX + distY * distY);
 
    return distance <= radius;
  };
 
  const updateAnnotationPosition = (id, x, y) => {
    onClick({
      type: "updatePosition",
      id,
      x: x / zoomScale,
      y: y / zoomScale,
      pdfId,
    });
  };
 
  const deleteAnnotation = (id) => {
    onClick({ type: "delete", id, pdfId });
  };
 
  const updateMark = (id, question, newMark) => {
    const numericMark = parseFloat(newMark) || 0;
    onClick({ type: "updateMark", id, question, mark: numericMark, pdfId });
    onUpdateMarks?.(question, numericMark, id);
    setIsEditing(null);
  };
 
  const toggleSidebar = () => setDocIsOpen((prev) => !prev);
  const toggleMarkSideBar = () => {
    setMarkDocIsOpen((prev) => !prev);
    toggleRightSidebar?.();
  };
 
  const handleViewerClick = (e) => {
    const isPdfClick = e.target.closest(
      ".react-pdf__Page, .react-pdf__Page__canvas, .react-pdf__Page__textLayer, .react-pdf__Page__annotationsLayer, .annotation-box"
    );
    const isDropdownClick = e.target.closest(".dropdown-menu, .dropdown-menu button");
    if (isPdfClick && !isDropdownClick && selectedTool !== "pen" && selectedTool !== "eraser" && selectedTool !== "digitPen" && !isEditing) {
  
      onClick(e);
    } 
  };
 
  return (
    <div className="w-full h-screen flex overflow-hidden">
      <div
        className={`border-r-2 border-gray-400 p-2 h-full flex flex-col shrink-0 transition-all duration-300 ${docIsOpen ? "w-60" : "w-0"}`}
        style={{ overflow: docIsOpen ? "visible" : "hidden" }}
      >
        <div className="px-2 py-3 border-b-2 text-center font-semibold text-lg shrink-0">
          Documents
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide mb-40">
          {pdfFile && docIsOpen ? (
            <Document
              className="flex flex-col justify-start items-center w-full"
              file={pdfFile}
              onLoadSuccess={onDocLoad}
            >
              {Array.from({ length: totalPages }, (_, index) => (
                <div
                  onClick={() => onPageChange(index + 1)}
                  className={`border-[4px] cursor-pointer relative rounded my-2 ${pageNum === index + 1 ? "border-green-700" : ""}`}
                  key={index}
                >
                  <Page width={200} pageNumber={index + 1} />
                </div>
              ))}
            </Document>
          ) : (
            docIsOpen && <div>Loading PDF...</div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="w-full bg-slate-100 h-full">
          <div className="bg-white h-16 py-2 px-4 flex justify-between items-center shadow-md shrink-0">
            <div className="flex gap-2">
              <button
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                onClick={toggleSidebar}
              >
                {docIsOpen ? (
                  <ChevronLeft size={20} className="text-gray-800" />
                ) : (
                  <ChevronRight size={20} className="text-gray-800" />
                )}
              </button>
              <button
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                onClick={handleZoomIn}
              >
                <ZoomIn size={20} className="text-gray-800" />
              </button>
              <button
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                onClick={handleZoomOut}
              >
                <ZoomOut size={20} className="text-gray-800" />
              </button>
            </div>
            <div className="flex justify-center items-center gap-1">
              <IoIosArrowBack
                className="cursor-pointer hover:text-gray-500 transition-colors duration-200"
                onClick={() => changePage("prev")}
              />
              <div className="px-3 py-1 bg-gray-100 rounded">{pageNum}</div>
              <span>of</span>
              <div className="px-3 py-1 bg-gray-100 rounded">{totalPages}</div>
              <IoIosArrowForward
                className="cursor-pointer hover:text-gray-500 transition-colors duration-200"
                onClick={() => changePage("next")}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full hover:bg-gray-900 text-gray-800 hover:text-gray-100 transition-all duration-200 shadow-sm"
                  onClick={togglePdfDropdownMenu}
                >
                  <FontAwesomeIcon icon={faCaretDown} size="lg" title="pdf"/>
                </button>
                {isPdfDropdownMenuOpen && (
                  <div
                    className="absolute top-12 right-0 bg-white shadow-lg rounded-lg border border-gray-200 z-[100] min-w-[200px] dropdown-menu visible"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="flex items-center w-full text-left px-4 py-2 text-green-600 hover:bg-green-100 transition-colors duration-200 dropdown-item"
                      onClick={handleSaveCopyClick}
                    >
                      <Save className="mr-2" size={16} /> Save
                    </button>
                    <button
                      className="flex items-center w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-100 transition-colors duration-200 dropdown-item"
                      onClick={handleGetSavedPdfClick}
                    >
                      Get Saved PDF
                    </button>
                    <button
                      className="flex items-center w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors duration-200 dropdown-item"
                      onClick={handleGetOriginalPdfClick}
                    >
                      Get Original PDF
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full hover:bg-gray-900 text-gray-800 hover:text-gray-100 transition-all duration-200 shadow-sm"
                  onClick={toggleValDropdownMenu}
                >
                  <FontAwesomeIcon icon={faCaretDown} size="lg" title="valuator types" />
                </button>
                {isValDropdownMenuOpen && (
                  <div
                    className="absolute top-12 right-0 bg-white shadow-lg rounded-lg border border-gray-200 z-[100] min-w-[200px] dropdown-menu visible"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[
                      { label: "Valuator 1", mode: "valuator1" },
                      { label: "Valuator 2", mode: "valuator2" },
                      { label: "Scrutiny 1", mode: "scrutiny1" },
                      { label: "Scrutiny 2", mode: "scrutiny2" },
                      { label: "Chief 1", mode: "chief1" },
                      { label: "Chief 2", mode: "chief2" },
                    ].map(({ label, mode }) => (
                      <button
                        key={mode}
                        className={`flex items-center w-full text-left px-4 py-2 ${
                          valuationMode === mode ? "bg-blue-500 text-white" : "text-gray-800 hover:bg-gray-100"
                        } transition-colors duration-200 dropdown-item`}
                        onClick={handleValuationSwitch(mode)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                onClick={toggleMarkSideBar}
              >
                {markDocIsOpen ? (
                  <ChevronRight size={20} className="text-gray-800" />
                ) : (
                  <ChevronLeft size={20} className="text-gray-800" />
                )}
              </button>
            </div>
          </div>
          <div className="flex-1 bg-slate-100 p-4 overflow-y-auto relative">
            {selectedTool === "pen" && (
              <div className="absolute top-4 left-4 bg-white p-4 rounded shadow-md z-10 flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  Opacity:
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={penOpacity}
                    onChange={(e) => setPenOpacity(parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <span>{penOpacity.toFixed(1)}</span>
                </label>
                <label className="flex items-center gap-2">
                  Size:
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={penSize}
                    onChange={(e) => setPenSize(parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <span>{penSize}px</span>
                </label>
                <label className="flex items-center gap-2">
                  Color:
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-8 h-8 p-0 border-none cursor-pointer"
                  />
                </label>
              </div>
            )}
            <div
              className="w-full flex justify-center items-start relative overflow-y-scroll h-[calc(100vh-80px)] scrollbar-hide"
              onClick={handleViewerClick}
              onMouseDown={
                selectedTool === "pen" || selectedTool === "digitPen"
                  ? startDrawing
                  : selectedTool === "eraser"
                  ? startErasing
                  : undefined
              }
              onMouseMove={
                selectedTool === "pen" || selectedTool === "digitPen"
                  ? draw
                  : selectedTool === "eraser"
                  ? erase
                  : undefined
              }
              onMouseUp={
                selectedTool === "pen" || selectedTool === "digitPen"
                  ? stopDrawing
                  : selectedTool === "eraser"
                  ? stopErasing
                  : undefined
              }
              onMouseLeave={
                selectedTool === "pen" || selectedTool === "digitPen"
                  ? stopDrawing
                  : selectedTool === "eraser"
                  ? stopErasing
                  : undefined
              }
            >
              {pdfFile ? (
                <Document file={pdfFile}>
                  <div style={{ position: "relative" }} ref={pageRef}>
                    <Page
                      scale={zoomScale}
                      pageNumber={pageNum}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="mb-8"
                    />
                    <canvas
                      ref={canvasRef}
                      width={595 * zoomScale}
                      height={842 * zoomScale}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none",
                      }}
                    />
                    {annotations
                      .filter((anno) => anno.page === pageNum && anno.pdfId === pdfId)
                      .map((anno) => {
                        const pdfWidth = 595 * zoomScale;
                        const pdfHeight = 842 * zoomScale;
                        const clampedX = Math.max(0, Math.min(anno.x * zoomScale, pdfWidth - (anno.width || 200) * zoomScale));
                        const clampedY = Math.max(0, Math.min(anno.y * zoomScale, pdfHeight - (anno.height || 50) * zoomScale));
                        const clampedWidth = Math.min((anno.width || 200) * zoomScale, pdfWidth - clampedX);
                        const clampedHeight = Math.min((anno.height || 50) * zoomScale, pdfHeight - clampedY);
 
                        const showDeleteIcon =
                          anno.type !== "pen" && selectedTool !== "pen" && selectedTool !== "eraser" && selectedTool !== "digitPen";
 
                        if (anno.type === "digitPen") return null;
 
                        return (
                          <Rnd
                            key={anno.id}
                            size={
                              anno.type === "text"
                                ? { width: clampedWidth, height: clampedHeight }
                                : { width: "auto", height: "auto" }
                            }
                            position={{ x: clampedX, y: clampedY }}
                            onDragStop={(e, d) => {
                              const newX = Math.max(0, Math.min(d.x, pdfWidth - clampedWidth));
                              const newY = Math.max(0, Math.min(d.y, pdfHeight - clampedHeight));
                              updateAnnotationPosition(anno.id, newX / zoomScale, newY / zoomScale);
                            }}
                            onResizeStop={(e, direction, ref, delta, position) => {
                              const newWidth = parseFloat(ref.style.width);
                              const newHeight = parseFloat(ref.style.height);
                              const newX = Math.max(0, Math.min(position.x, pdfWidth - newWidth));
                              const newY = Math.max(0, Math.min(position.y, pdfHeight - newHeight));
 
                              onClick({
                                type: "updateSize",
                                id: anno.id,
                                width: newWidth / zoomScale,
                                height: newHeight / zoomScale,
                                pdfId,
                              });
                              updateAnnotationPosition(anno.id, newX / zoomScale, newY / zoomScale);
                            }}
                            enableResizing={
                              anno.type === "text"
                                ? { top: true, right: true, bottom: true, left: true }
                                : false
                            }
                            style={{
                              backgroundColor: "transparent",
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "4px",
                              zIndex: 1000,
                              borderRadius: "4px",
                              position: "absolute",
                              boxSizing: "border-box",
                              gap: "30px",
                              border: showDeleteIcon ? "1px solid red" : "none",
                            }}
                            className="annotation-box"
                            bounds="parent"
                          >
                            {anno.type === "mark" && isEditing === anno.id ? (
                              <input
                                type="number"
                                defaultValue={anno.mark}
                                onBlur={(e) => updateMark(anno.id, anno.question, e.target.value)}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && updateMark(anno.id, anno.question, e.target.value)
                                }
                                className="w-40 p-1 border rounded"
                                step="0.5"
                                autoFocus
                              />
                            ) : (
                              <span
                                style={
                                  anno.type === "text"
                                    ? {
                                        fontSize: `${(anno.size || 16) * zoomScale}px`,
                                        color: anno.color || "#000000",
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                        whiteSpace: "pre-wrap",
                                        lineHeight: "1.2",
                                        width: "100%",
                                        maxHeight: "100%",
                                        overflow: "auto",
                                        textAlign: "left",
                                        fontFamily: "Arial, sans-serif",
                                        fontWeight: anno.fontWeight || "normal",
                                      }
                                    : {
                                        fontSize: `${20 * zoomScale}px`,
                                        color: anno.type === "question" ? "black" : "red",
                                      }
                                }
                              >
                                {anno.type === "mark" && `Q${anno.question}: ${anno.mark}`}
                                {anno.type === "check" && (
                                  <FontAwesomeIcon icon={faCheck} style={{ fontSize: `${40 * zoomScale}px`, color: "green" }} />
                                )}
                                {anno.type === "times" && (
                                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: `${40 * zoomScale}px`, color: "red" }} />
                                )}
                                {anno.type === "trash" && (
                                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: `${20 * zoomScale}px`, color: "gray" }} />
                                )}
                                {anno.type === "question" && (
                                  <FontAwesomeIcon icon={faQuestion} style={{ fontSize: `${40 * zoomScale}px`, color: "red" }} />
                                )}
                                {anno.type === "text" && (anno.text || "No text provided")}
                              </span>
                            )}
                            <div className="absolute bottom-1 right-1 flex gap-2 annotation-actions">
                              {anno.type === "mark" && (
                                <FontAwesomeIcon
                                  icon={faEdit}
                                  className="text-blue-500 cursor-pointer hover:text-blue-700 opacity-0 transition-opacity duration-200 annotation-edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(anno.id);
                                  }}
                                  title="Edit Mark"
                                />
                              )}
                              {showDeleteIcon && (
                                <div className="flex gap-2 annotation-actions" style={{ marginTop: "4px" }}>
                                  <FontAwesomeIcon
                                    icon={faTrash}
                                    className="text-red-500 cursor-pointer hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteAnnotation(anno.id);
                                    }}
                                    title="Delete Annotation"
                                  />
                                </div>
                              )}
                            </div>
                          </Rnd>
                        );
                      })}
                  </div>
                </Document>
              ) : (
                <div>Loading PDF...</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          .annotation-box:hover .annotation-actions {
            opacity: 1;
          }
          .dropdown-menu {
            transform-origin: top right;
            transform: translateY(-10px);
            opacity: 0;
            transition: transform 0.3s ease-out, opacity 0.3s ease-out;
          }
          .dropdown-menu.visible {
            transform: translateY(0);
            opacity: 1;
          }
          .dropdown-item {
            transform: translateY(-5px);
            opacity: 0;
            transition: transform 0.3s ease-out, opacity 0.3s ease-out;
          }
          .dropdown-menu.visible .dropdown-item {
            transform: translateY(0);
            opacity: 1;
          }
          .dropdown-menu.visible .dropdown-item:nth-child(1) { transition-delay: 0.1s; }
          .dropdown-menu.visible .dropdown-item:nth-child(2) { transition-delay: 0.15s; }
          .dropdown-menu.visible .dropdown-item:nth-child(3) { transition-delay: 0.2s; }
          .dropdown-menu.visible .dropdown-item:nth-child(4) { transition-delay: 0.25s; }
          .dropdown-menu.visible .dropdown-item:nth-child(5) { transition-delay: 0.3s; }
          .dropdown-menu.visible .dropdown-item:nth-child(6) { transition-delay: 0.35s; }
        `}
      </style>
    </div>
  );
};
 
export default Viewer;