import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
const QuestionAnswerBank = ({
  showModal,
  activePdfType,
  setActivePdfType,
  pageNum,
  //   onPageChange,
  onLoadSuccess,
  //   annotations,
  //   onClick,
}) => {
  const [isPdfVisible, setIsPdfVisible] = useState(false);
  // const [totalPages, setTotalPages] = useState(0);
  // const [zoomLevel, setZoomLevel] = useState(200);

 
  // Set up pdf.js worker
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
  }, []);
 
  const handleButtonClick = (type) => {
    showModal();
    if (activePdfType === type && isPdfVisible) {
    //   setIsPdfVisible(false); // Hide if same button clicked again
    } else {
      setActivePdfType(type);
      setIsPdfVisible(true); // Show PDF
    }
  };
 
  // const onDocLoad = (event) => {
  
  //   setTotalPages(event.numPages);
  //   if (onLoadSuccess) onLoadSuccess(event.numPages);
  // };
 
  // const handleZoomIn = () => {
  //   setZoomLevel((prev) => Math.min(prev + 50, 700));
  // };
  // const handleZoomOut = () => {
  //   setZoomLevel((prev) => Math.max(prev - 50, 100));
  // };
 
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button
        id="question-paper-btn"
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            activePdfType === "questionPaper"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => handleButtonClick("questionPaper")}
          data-inro ="Click t view the  question-paper in a model"
          data-step="92"
        >
          Question Paper
          <ChevronDown
 
            className={`transition-transform duration-200 ${
              activePdfType === "questionPaper" && isPdfVisible
                ? "rotate-180"
                : ""
            }`}
          />
        </button>
        <button
        id="answer-sheet-btn"
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            activePdfType === "answerSheet"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => handleButtonClick("answerSheet")}
           data-inro ="Click t view the  answer sheet in a model"
          data-step="93"
        >
          Answer Sheet
          <ChevronDown
            className={`transition-transform duration-200 ${
              activePdfType === "answerSheet" && isPdfVisible
                ? "rotate-180"
                : ""
            }`}
          />
        </button>
        <button
        id="objective-btn"
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            activePdfType === "objective"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => handleButtonClick("objective")}
            data-inro ="Click t view the  answer sheet in a model"
          data-step="93"
        >
          Objective
          <ChevronDown
            className={`transition-transform duration-200 ${
              activePdfType === "objective" && isPdfVisible ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
};
 
export default QuestionAnswerBank;