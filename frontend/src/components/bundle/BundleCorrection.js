import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate, useParams } from "react-router-dom";
import { pdfjs, Document, Page } from "react-pdf";
import { PDFDocument, rgb } from "pdf-lib";
import Viewer from "../../pdf/Viewer";
import { Modal } from "antd";
import { X, XIcon } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  faArrowLeft,
  faPen,
  faCheck,
  faTimes,
  faUndo,
  faRedo,
  faTrash,
  faQuestion,
  faCaretDown,
  faEdit,
  faEraser,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QuestionAnswerBank from "../questionbanks/QuestionAnswerBank";
import { Rnd } from "react-rnd";
import introJs from "intro.js";
import FinishEvaluation from "./FinishEvaluation";
import { useAuth } from "../../context/AuthContext";
import image from '../../assets/image.png'
 
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
 
const BundleCorrection = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedMark, setSelectedMark] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [annotationsByPdf, setAnnotationsByPdf] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [timers, setTimers] = useState({});
  const [visitedPages, setVisitedPages] = useState(new Set());
  const { userId } = useParams();
  const navigate = useNavigate();
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [textSize, setTextSize] = useState(16);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [hoveredQuestion, setHoveredQuestion] = useState(null);
  const [listOfStudents, setListOfStudent] = useState([]);
  const [activePdfType, setActivePdfType] = useState("answerSheet");
  const [isTimeoutModalVisible, setIsTimeoutModalVisible] = useState(false);
  const [isSwitchModalVisible, setIsSwitchModalVisible] = useState(false);
  const [isSaveNoteVisible, setIsSaveNoteVisible] = useState(false);
  const [
    isContinueCorrectionModalVisible,
    setIsContinueCorrectionModalVisible,
  ] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [pendingStudentRoll, setPendingStudentRoll] = useState(null);
  const [savedStates, setSavedStates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [studentStatuses, setStudentStatuses] = useState({});
  const [countdown, setCountdown] = useState(600);
  const draggleRef = useRef(null);
  // CHANGE: Added new state variables for in-place mark editing
  const [editingAnnotationId, setEditingAnnotationId] = useState(null);
  const [editMarkValue, setEditMarkValue] = useState("");
  const [zoomScale, setZoomScale] = useState(1);
  const [forceButtonRender, setForceButtonRender] = useState(0);
  const staticStudents = [
    { StudId: "12340" },
    { StudId: "4888" },
    { StudId: "12342" },
    { StudId: "12343" },
    { StudId: "12345" },
  ];

  const userData=JSON.parse(localStorage.getItem("user"))
  // const currentPdfId = selectedStudentRoll
  //   ? `1234_${selectedStudentRoll}`
  //   : "1234_default";
  const currentPdfId = useMemo(() => {
    return selectedStudentRoll ? `1234_${selectedStudentRoll}` : "1234_default";
  }, [selectedStudentRoll]);
 
  const [scores, setScores] = useState([]);
  const [visible, setVisible] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0, 
  });
 
  const BUNDLE_ID = "29";
  const MAX_TIME_LIMIT = 1800;
  const INACTIVITY_TIMEOUT = 1000;
  const COUNTDOWN_TIMEOUT = 100;
 
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };
 
  const saveToLocalStorage = useCallback(
    debounce((key, data) => {
      localStorage.setItem(key, JSON.stringify(data));
    }, 500),
    []
  );  
 
  useEffect(() => {
        if(!userData){
      navigate("/login");
      return;
    }
      // const saved = localStorage.getItem(`correctionStates_${userData.id}`);
      const savedStatuses = localStorage.getItem(`studentStatuses_${userData.id}`);
      const initialStatuses = {};
      
      // if (saved) {
      //   const parsedStates = JSON.parse(saved);
      //   setSavedStates(parsedStates);
      //   staticStudents.forEach((student) => {
      //     const roll = student.StudId;
      //     if (parsedStates[roll] && parsedStates[roll].isSaved) {
      //       initialStatuses[roll] = "finished";
      //     } else if (
      //       parsedStates[roll] &&
      //       parsedStates[roll].annotations.length > 0
      //     ) {
      //       initialStatuses[roll] = "annotated";
      //     } else if (
      //       parsedStates[roll] &&
      //       parsedStates[roll].visitedPages.length > 0
      //     ) {
      //       initialStatuses[roll] = "visited";
      //     } else {
      //       initialStatuses[roll] = "not_attempted";
      //     }
      //   });
      // } else {
      //   staticStudents.forEach((student) => {
      //     initialStatuses[student.StudId] = "not_attempted";
      //   });
      // }
  
      // Reset any "currently_working" statuses from savedStatuses
      let finalStatuses = initialStatuses;
      if (savedStatuses) {
        const parsedStatuses = JSON.parse(savedStatuses);
        finalStatuses = { ...initialStatuses };
        staticStudents.forEach((student) => {
          const roll = student.StudId;
          // if (parsedStatuses[roll] === "currently_working") {
          //   finalStatuses[roll] =
          //     saved && JSON.parse(saved)[roll]?.annotations.length > 0
          //       ? "annotated"
          //       : "finished";
          // } else if (parsedStatuses[roll]) {
          //   finalStatuses[roll] = parsedStatuses[roll];
          // }
        });
      }
  
      setStudentStatuses(finalStatuses);
      localStorage.setItem(
        `studentStatuses_${userData.id}`,
        JSON.stringify(finalStatuses)
      );
    }
    //  else {
    //   navigate("/login");
    // }
  , [userData.id, navigate]);
  useEffect(() => {
    // MODIFIED: Ensure all_corrected status is consistent and reverts if needed
    const allFinished = staticStudents.every(
      (student) => studentStatuses[student.StudId] === "finished"
    );
    if (allFinished) {
      setStudentStatuses((prev) => {
        const updated = {};
        staticStudents.forEach((student) => {
          updated[student.StudId] = "all_corrected";
        });
        saveToLocalStorage(`studentStatuses_${userId}`, updated);
        return updated;
      });
      const bundleStatuses = JSON.parse(
        localStorage.getItem(`bundleStatuses_${userId}`) || "{}"
      );
      bundleStatuses[BUNDLE_ID] = "finished";
      saveToLocalStorage(`bundleStatuses_${userId}`, bundleStatuses);
    } else {
      // NEW: Revert all_corrected if any student is not finished
      setStudentStatuses((prev) => {
        const updated = { ...prev };
        let hasChanges = false;
        staticStudents.forEach((student) => {
          if (
            updated[student.StudId] === "all_corrected" &&
            studentStatuses[student.StudId] !== "finished"
          ) {
            updated[student.StudId] =
              studentStatuses[student.StudId] || "finished";
            hasChanges = true;
          }
        });
        if (hasChanges) {
          saveToLocalStorage(`studentStatuses_${userId}`, updated);
        }
        return updated;
      });
    }
  }, [userId, saveToLocalStorage]);
 
  const startTour = () => {
    const intro = introJs();
    intro.setOptions({
      steps: [
        {
          intro:
            "Welcome to the Bundle Correction tool! This tour will guide you through all functionalities.",
        },
        {
          element: "#back-button",
          intro: "Click this to return to the home page.",
        },
        {
          element: "#student-container",
          intro:
            "Select a student roll number here to load their answer sheet.",
        },
        {
          element: "#marks-tools-dropdown",
          intro:
            "Click here to open the dropdown for marks and annotation tools.",
        },
        {
          element: "#mark-0",
 
          intro:
            "Select a mark (e.g., 0) to assign it to a question on the PDF.",
        },
        {
          element: "#tool-check",
          intro: "Use the checkmark tool to mark answers as correct.",
        },
        {
          element: "#tool-times",
          intro: "Use the cross tool to mark answers as incorrect.",
        },
        {
          element: "#tool-pen",
          intro: "Use the pen tool to draw freehand annotations on the PDF.",
        },
        {
          element: "#tool-trash",
          intro: "Use the trash tool to mark sections for deletion.",
        },
        {
          element: "#tool-text",
          intro: "Add text comments to the PDF with this tool.",
        },
        {
          element: "#tool-undo",
          intro: "Undo your last annotation with this button.",
        },
        {
          element: "#tool-redo",
          intro: "Redo an undone annotation with this button.",
        },
        {
          element: "#pdf-viewer-container",
          intro:
            "This is the PDF viewer where you annotate the answer sheet. Click to apply marks/tools.",
        },
        {
          element: "#marks-table",
          intro:
            "Track and edit question scores here. Click a row to select a question.",
        },
        {
          element: "#edit-score-1",
          intro: "Click the edit icon to manually adjust a question's score.",
        },
        {
          element: "#page-numbers",
          intro:
            "Navigate PDF pages here. Green means visited, yellow is current.",
        },
        {
          element: "#question-answer-bank",
          intro: "Switch between Question Paper and Answer Sheet views here.",
        },
        {
          element: "#question-paper-btn",
          intro: "Click to view the Question Paper in a modal.",
        },
        {
          element: "#answer-sheet-btn",
          intro: "Click to view the Answer Sheet in a modal.",
        },
        {
          element: "#terms-checkbox",
          intro:
            "Check this to confirm all scripts in the bundle are corrected.",
        },
        {
          element: "#finish-evaluation",
          intro:
            "Click to save your annotations and finish the evaluation, enabled only after agreeing to terms.",
        },
      ],
      showProgress: true,
      exitOnOverlayClick: false,
    });
    intro.start();
  };
 
  useEffect(() => {
    if (!selectedStudentRoll) return;
 
    const state = {
      annotations: annotationsByPdf[currentPdfId] || [],
      timer: timers[selectedStudentRoll] || {
        elapsedTime: 0,
        isRunning: false,
        startTime: null,
      },
      pageNum,
      scores,
      visitedPages: Array.from(visitedPages),
      isSaved: studentStatuses[selectedStudentRoll] === "finished",
    };
 
    setSavedStates((prev) => {
      const prevState = prev[selectedStudentRoll];
      // Avoid updating if the state hasn't changed
      if (
        prevState &&
        JSON.stringify(prevState.annotations) ===
          JSON.stringify(state.annotations) &&
        prevState.timer.elapsedTime === state.timer.elapsedTime &&
        prevState.timer.isRunning === state.timer.isRunning &&
        prevState.pageNum === state.pageNum &&
        JSON.stringify(prevState.scores) === JSON.stringify(state.scores) &&
        JSON.stringify(prevState.visitedPages) ===
          JSON.stringify(state.visitedPages) &&
        prevState.isSaved === state.isSaved
      ) {
        return prev;
      }
 
      const updated = { ...prev, [selectedStudentRoll]: state };
      // saveToLocalStorage(`correctionStates_${userData.id}`, updated);
      return updated;
    });
  }, [
    selectedStudentRoll,
    currentPdfId,
    annotationsByPdf,
    timers,
    pageNum,
    scores,
    visitedPages,
    studentStatuses,
    userId,
    saveToLocalStorage,
  ]);
 
  useEffect(() => {
    // Handle user activity to reset inactivity timer
    const handleActivity = (event) => {
      const currentTime = Date.now();
      // setLastActivityTime((prev) => {
      //   return currentTime;
      // });
      setLastActivityTime(currentTime);
      // Reset countdown if timeout modal is visible
      if (isTimeoutModalVisible) {
        setCountdown(COUNTDOWN_TIMEOUT);
      }
    };
  
    // Add event listeners for all relevant user interactions
    const events = [
      "mousemove",
      "keydown",
      "click",
      "touchstart", // For mobile/touch devices
      "scroll", // For scroll interactions
    ];
  
    // Attach to window
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  
    // Attach to PDF viewer container to capture events within Viewer.jsx
    const pdfContainer = document.getElementById("pdf-viewer-container");
    if (pdfContainer) {
      events.forEach((event) => {
        pdfContainer.addEventListener(event, handleActivity, { passive: true });
      });
    } 
  
    // Inactivity check interval
    const checkInactivity = setInterval(() => {
      // Skip if no student is selected or any modal is open
      if (
        !selectedStudentRoll ||
        isTimeoutModalVisible ||
        isSwitchModalVisible ||
        isContinueCorrectionModalVisible ||
        isSaveNoteVisible
      ) {
        return;
      }
  
      const timeSinceLastActivity = (Date.now() - lastActivityTime) / 1000;
     
  
      // Double-check recent activity to prevent false positives
      if (
        timeSinceLastActivity >= INACTIVITY_TIMEOUT &&
        Date.now() - lastActivityTime >= INACTIVITY_TIMEOUT * 1000
      ) {
       
        setIsTimeoutModalVisible(true);
        setCountdown(COUNTDOWN_TIMEOUT);
        setTimers((prev) => ({
          ...prev,
          [selectedStudentRoll]: {
            ...prev[selectedStudentRoll],
            isRunning: false,
            startTime: null,
          },
        }));
      }
    }, 1000);
  
    // Countdown for timeout modal
    let countdownInterval;
    if (isTimeoutModalVisible) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
         
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  
    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity, { passive: true });
        if (pdfContainer) {
          pdfContainer.removeEventListener(event, handleActivity, {
            passive: true,
          });
        }
      });
      clearInterval(checkInactivity);
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
     
    };
  }, [
    isTimeoutModalVisible,
    isSwitchModalVisible,
    isContinueCorrectionModalVisible,
    isSaveNoteVisible,
    selectedStudentRoll,
    navigate,
    lastActivityTime, // Added to ensure state updates trigger effect
  ]);
  useEffect(() => {
    if (!selectedStudentRoll) return;
 
    const timer = setInterval(() => {
      if (
        !isTimeoutModalVisible &&
        !isSwitchModalVisible &&
        !isContinueCorrectionModalVisible &&
        !isSaveNoteVisible &&
        timers[selectedStudentRoll]?.isRunning
      ) {
        setTimers((prev) => {
          const currentTimer = prev[selectedStudentRoll];
          if (!currentTimer || !currentTimer.isRunning) return prev;
          const currentTime = Date.now();
          const elapsedTime = Math.floor(
            (currentTime - currentTimer.startTime) / 1000
          );
          if (elapsedTime >= MAX_TIME_LIMIT) {
            return {
              ...prev,
              [selectedStudentRoll]: {
                ...currentTimer,
                elapsedTime: MAX_TIME_LIMIT,
                isRunning: false,
              },
            };
          }
          return {
            ...prev,
            [selectedStudentRoll]: { ...currentTimer, elapsedTime },
          };
        });
      }
    }, 1000);
 
    return () => clearInterval(timer);
  }, [
    selectedStudentRoll,
    isTimeoutModalVisible,
    isSwitchModalVisible,
    isContinueCorrectionModalVisible,
    isSaveNoteVisible,
    timers,
  ]);
 
  useEffect(() => {
    const fetchScores = async () => {
      if (!selectedStudentRoll) return;
      try {
        const response = await fetch(
          "https://tpceprod.beessoftware.cloud/ReactAPI/api/GitamEvaluation/EvalSingleMarksDisplayStudidNewAdmin",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              GrpCode: "TPCEPROD",
              ColCode: "0001",
              SchoolId: "1",
              ColId: "1",
              ValId: "4",
              BundleId: "29",
              ValType: "149",
              Sem: "I-Sem",
              ExamCode: "24MA101BS",
              StudId: "1",
            }),
          }
        );
        const result = await response.json();
        const apiScores = result.MarksDisplayTable2 || [];
        const fetchedScores = apiScores.map((item) => ({
          question: item.QId,
          outOf: parseFloat(item.QMaxMarks) || 10,
          score: parseFloat(item.Marksold) || 0,
          isComplete:
            (parseFloat(item.Marksold) || 0) >=
            (parseFloat(item.QMaxMarks) || 10),
        }));
        setScores(fetchedScores);
      } catch (error) {
        console.error("Error fetching scores:", error);
        setScores([]);
      }
    };
    fetchScores();
  }, [selectedStudentRoll]);
 
  useEffect(() => {
    const loadPdf = async () => {
      if (!selectedStudentRoll) return;
      setIsLoading(true);
      try {
        const originalPdfUrl = `https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/uploads/${selectedStudentRoll}`;
        const response = await fetch(originalPdfUrl);
        
        if (!response.ok) throw new Error("Failed to load PDF");
        setCurrentPdfUrl(originalPdfUrl);
        setAnnotationsByPdf((prev) => ({ ...prev, [currentPdfId]: [] }));
        setUndoStack([]);
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert(
          `Error loading PDF for student ${selectedStudentRoll}: ${error.message}`
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadPdf();
  }, [selectedStudentRoll, currentPdfId]);
 
  useEffect(() => {
    if (!annotationsByPdf[currentPdfId]) {
      setAnnotationsByPdf((prev) => ({ ...prev, [currentPdfId]: [] }));
    }
  }, [currentPdfId, annotationsByPdf]);
 
  const handleUpdateMarks = (question, newMark, annotationId) => {
    const numericMark = parseFloat(newMark) || 0;
    const questionData = scores.find((q) => q.question === question);
    const currentAnnotations = annotationsByPdf[currentPdfId] || [];
    const annotationToUpdate = currentAnnotations.find(
      (anno) => anno.id === annotationId
    );
    const oldMark = annotationToUpdate ? annotationToUpdate.mark : 0;
 
    const currentTotalMarks = currentAnnotations
      .filter(
        (anno) =>
          anno.type === "mark" &&
          anno.question === question &&
          anno.id !== annotationId
      )
      .reduce((sum, anno) => sum + anno.mark, 0);
 
    const newTotalMarks = currentTotalMarks + numericMark;
 
    if (newTotalMarks > questionData.outOf) {
      alert(
        `Total marks (${newTotalMarks}) exceed the maximum (${questionData.outOf}) for question ${question}!`
      );
      return false;
    }
 
    setScores((prevScores) =>
      prevScores.map((item) =>
        item.question === question
          ? {
              ...item,
              score: newTotalMarks,
              isComplete: newTotalMarks >= item.outOf,
            }
          : item
      )
    );
 
    setAnnotationsByPdf((prev) => ({
      ...prev,
      [currentPdfId]: prev[currentPdfId].map((anno) =>
        anno.id === annotationId ? { ...anno, mark: numericMark } : anno
      ),
    }));
 
    return true;
  };
 
  const handlePdfClick = (e) => {
    if (isEditingText || !selectedStudentRoll) return;
 
    if (e.type === "updatePosition") {
      // setAnnotationsByPdf((prev) => ({
      //   ...prev,
      //   [currentPdfId]: prev[currentPdfId].map((anno) =>
      //     anno.id === e.id ? { ...anno, x: e.x, y: e.y } : anno
      //   ),
      // }));
      setAnnotationsByPdf((prev) => ({
        ...prev,
        [currentPdfId]: prev[currentPdfId].map((anno) =>
          anno.id === e.id
            ? {
                ...anno,
                x: e.x * zoomScale, // Adjust the X coordinate based on zoom
                y: e.y * zoomScale, // Adjust the Y coordinate based on zoom
              }
            : anno
        ),
      }));
      return;
    }
    if (e.type === "updateSize") {
      setAnnotationsByPdf((prev) => ({
        ...prev,
        [currentPdfId]: prev[currentPdfId].map((anno) =>
          (anno.id || e.id) === e.id
            ? { ...anno, width: e.width, height: e.height }
            : anno
        ),
      }));
      return;
    }
    if (e.type === "delete") {
      const annotationToDelete = annotationsByPdf[currentPdfId].find(
        (anno) => anno.id === e.id
      );
      setAnnotationsByPdf((prev) => ({
        ...prev,
        [currentPdfId]: prev[currentPdfId].filter((anno) => anno.id !== e.id),
      }));
 
      if (annotationToDelete && annotationToDelete.type === "mark") {
        const totalMarkForQuestion = annotationsByPdf[currentPdfId]
          .filter(
            (anno) =>
              anno.type === "mark" &&
              anno.question === annotationToDelete.question &&
              anno.id !== e.id
          )
          .reduce((sum, anno) => sum + anno.mark, 0);
        setScores((prevScores) =>
          prevScores.map((item) =>
            item.question === annotationToDelete.question
              ? {
                  ...item,
                  score: totalMarkForQuestion,
                  isComplete: totalMarkForQuestion >= item.outOf,
                }
              : item
          )
        );
      }
      return;
    }
 
    if (e.type === "updateMark") {
      const success = handleUpdateMarks(e.question, e.mark, e.id);
      if (!success) return;
      return;
    }
 
    if (!selectedMark && !selectedTool) {
      const pdfContainer = e.target.closest(".react-pdf__Page");
      const annotationContainer = e.target.closest(".annotation-box");
      if (!pdfContainer && !annotationContainer) {
        alert("Clicked outside PDF page");
      }
      return;
    }
 
    const pdfContainer = e.target.closest(".react-pdf__Page");
    if (!pdfContainer) {
      return;
    }
    const rect = pdfContainer.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomScale;
    const y = (e.clientY - rect.top) / zoomScale;
 
    let newAnnotation;
    if (selectedMark !== null && selectedQuestion !== null) {
      const questionData = scores.find((q) => q.question === selectedQuestion);
      const currentTotalForQuestion = (annotationsByPdf[currentPdfId] || [])
        .filter(
          (anno) => anno.type === "mark" && anno.question === selectedQuestion
        )
        .reduce((sum, anno) => sum + anno.mark, 0);
      if (currentTotalForQuestion + selectedMark > questionData.outOf) {
        alert(
          `Total marks (${
            currentTotalForQuestion + selectedMark
          }) exceed the maximum (${
            questionData.outOf
          }) for question ${selectedQuestion}!`
        );
        return;
      }
      newAnnotation = {
        id: Date.now(),
        type: "mark",
        question: selectedQuestion,
        mark: selectedMark,
        page: pageNum,
        x,
        y,
        pdfId: currentPdfId,
      };
      console.log(newAnnotation)
      const totalMarkForQuestion = currentTotalForQuestion + selectedMark;
      setScores((prevScores) =>
        prevScores.map((item) =>
          item.question === selectedQuestion
            ? {
                ...item,
                score: totalMarkForQuestion,
                isComplete: totalMarkForQuestion >= item.outOf,
              }
            : item
        )
      );
      setSelectedQuestion(null);
      setSelectedMark(null);
    } else if (selectedTool === "text") {
      if (!textInput.trim()) {
        alert("Please enter text for the annotation!");
        return;
      }
      newAnnotation = {
        id: Date.now(),
        type: "text",
        text: textInput,
        color: textColor,
        size: textSize,
        page: pageNum,
        x,
        y,
        width: 200,
        height: 50,
        pdfId: currentPdfId,
      };
      setTextInput("");
      setTextColor("#000000");
      setTextSize(16);
      setSelectedTool(null);
    } else if (selectedTool) {
      newAnnotation = {
        id: Date.now(),
        type: selectedTool,
        page: pageNum,
        x,
        y,
        pdfId: currentPdfId,
      };
      setSelectedTool(null);
    } else {
      alert("Please select a mark or tool first!");
      return;
    }
 
    setAnnotationsByPdf((prev) => ({
      ...prev,
      [currentPdfId]: [...(prev[currentPdfId] || []), newAnnotation],
    }));
    setUndoStack([]);
    setVisitedPages((prev) => new Set(prev).add(pageNum));
  };
 
  const getQuestionPages = (question) => {
    return (annotationsByPdf[currentPdfId] || [])
      .filter((anno) => anno.type === "mark" && anno.question === question)
      .map((anno) => ({ page: anno.page, mark: anno.mark, id: anno.id }));
  };
 
  const handleFreehandDrawing = (path) => {
    const newAnnotation = {
      id: Date.now(),
      type: "pen",
      page: pageNum,
      path,
      pdfId: currentPdfId,
    };
    setAnnotationsByPdf((prev) => ({
      ...prev,
      [currentPdfId]: [...(prev[currentPdfId] || []), newAnnotation],
    }));
    setUndoStack([]);
  };
 
  const handlePageLoad = (totalPages) => setNumPages(totalPages);
 
  const handleCheckboxChange = (question) => {
    setScores((prevScores) =>
      prevScores.map((item) =>
        item.question === question
          ? { ...item, isComplete: !item.isComplete }
          : item
      )
    );
  };
 
  const handleUndo = () => {
    const currentAnnotations = annotationsByPdf[currentPdfId] || [];
    if (currentAnnotations.length === 0) return;
 
    const lastAnnotation = currentAnnotations[currentAnnotations.length - 1];
    const newAnnotations = currentAnnotations.slice(0, -1);
 
    setAnnotationsByPdf((prev) => ({
      ...prev,
      [currentPdfId]: newAnnotations,
    }));
    setUndoStack((prev) => [...prev, lastAnnotation]);
 
    if (lastAnnotation.type === "mark") {
      const totalMarkForQuestion = newAnnotations
        .filter(
          (anno) =>
            anno.type === "mark" && anno.question === lastAnnotation.question
        )
        .reduce((sum, anno) => sum + anno.mark, 0);
      setScores((prevScores) =>
        prevScores.map((item) =>
          item.question === lastAnnotation.question
            ? {
                ...item,
                score: totalMarkForQuestion,
                isComplete: totalMarkForQuestion >= item.outOf,
              }
            : item
        )
      );
    }
  };
 
  const handleRedo = () => {
    if (undoStack.length === 0) return;
    const lastUndone = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
 
    setAnnotationsByPdf((prev) => ({
      ...prev,
      [currentPdfId]: [...(prev[currentPdfId] || []), lastUndone],
    }));
    setUndoStack(newUndoStack);
 
    if (lastUndone.type === "mark") {
      const totalMarkForQuestion = (annotationsByPdf[currentPdfId] || [])
        .filter(
          (anno) =>
            anno.type === "mark" && anno.question === lastUndone.question
        )
        .reduce((sum, anno) => sum + anno.mark, lastUndone.mark);
      setScores((prevScores) =>
        prevScores.map((item) =>
          item.question === lastUndone.question
            ? {
                ...item,
                score: totalMarkForQuestion,
                isComplete: totalMarkForQuestion >= item.outOf,
              }
            : item
        )
      );
    }
  };
 
  const handlePageNumberClick = (page) => {
    setPageNum(page);
    setVisitedPages((prev) => new Set(prev).add(page));
  };
 
  const handleSaveCopy = useCallback(async () => {
    if (!selectedStudentRoll) {
      alert("Please select a student roll number first!");
      return false;
    }
 
    setIsLoading(true);
    try {
      const response = await fetch(currentPdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");
      const arrayBuffer = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
 
      const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
      };
 
      const annotations = annotationsByPdf[currentPdfId] || [];
      for (const anno of annotations) {
        const page = pages[anno.page - 1];
        if (!page) continue;
 
        // if (anno.type === "mark") {
        //   page.drawText(`Q${anno.question}: ${anno.mark}`, {
        //     x: anno.x,
        //     y: page.getHeight() - anno.y,
        //     size: 20,
        //     color: rgb(1, 0, 0),
        //   });
        // }
        if (anno.type === "mark") {
          const fontSize = 20;
          const yOffset = fontSize * 1.4; // 🔧 dynamic offset instead of hardcoded 35
 
          page.drawText(`Q${anno.question}: ${anno.mark}`, {
            x: anno.x,
            y: page.getHeight() - anno.y - yOffset,
            size: fontSize,
            color: rgb(1, 0, 0),
          });
        } else if (anno.type === "check") {
          const baseSize = 5;
          const maxCheckSize = Math.min(baseSize * 5, 100);
          const checkSize = maxCheckSize;
          const thickness = Math.min(12, checkSize / 5);
          const radius = thickness / 2;
 
          const pageWidth = page.getWidth();
          const pageHeight = page.getHeight();
 
          // ✅ Y flipped like in question marker
          const fixedY = pageHeight - anno.y;
          const fixedX = anno.x;
 
          // Center point of check
          const startX = fixedX + checkSize / 2;
          const startY = fixedY - 35;
 
          // Left leg end
          const endX1 = Math.max(0, Math.min(fixedX, pageWidth));
          const endY1 = Math.min(startY + checkSize / 2, pageHeight);
 
          // Right leg end
          const endX2 = Math.max(
            0,
            Math.min(fixedX + checkSize + 15, pageWidth)
          );
          const endY2 = Math.min(startY + checkSize, pageHeight);
 
          const color = rgb(0 / 255, 128 / 255, 0 / 255);
 
          // Draw tick legs
          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX1, y: endY1 },
            thickness,
            color,
          });
 
          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX2, y: endY2 },
            thickness,
            color,
          });
 
          // Circle ends (for smoother visual)
          const drawCircle = (x, y) => {
            page.drawCircle({
              x,
              y,
              size: radius,
              color,
            });
          };
 
          drawCircle(startX, startY); // center
          drawCircle(endX1, endY1); // left leg end
          drawCircle(endX2, endY2); // right leg end
        } else if (anno.type === "times") {
          const size = 25;
          const thickness = size / 5;
          const halfSize = size / 2;
          const radius = thickness / 2;
 
          const pageHeight = page.getHeight();
 
          const xOffset = 18; // optional tweak
          const yOffset = size * 1; // 🔧 dynamic vertical alignment
 
          // Apply dynamic offset
          const centerX = anno.x + xOffset;
          const centerY = pageHeight - anno.y - yOffset;
 
          const color = rgb(1, 0, 0); // Red
 
          // Diagonal lines of the "X"
          const line1Start = { x: centerX - halfSize, y: centerY - halfSize };
          const line1End = { x: centerX + halfSize, y: centerY + halfSize };
 
          const line2Start = { x: centerX - halfSize, y: centerY + halfSize };
          const line2End = { x: centerX + halfSize, y: centerY - halfSize };
 
          // Draw the two crossing lines
          page.drawLine({
            start: line1Start,
            end: line1End,
            thickness,
            color,
          });
 
          page.drawLine({
            start: line2Start,
            end: line2End,
            thickness,
            color,
          });
 
          // Rounded ends
          const drawCircle = (x, y) => {
            page.drawCircle({
              x,
              y,
              size: radius,
              color,
            });
          };
 
          [line1Start, line1End, line2Start, line2End].forEach(({ x, y }) =>
            drawCircle(x, y)
          );
        } else if (anno.type === "times") {
          const size = 25;
          const thickness = size / 5;
          const halfSize = size / 2;
          const radius = thickness / 2;
 
          const pageHeight = page.getHeight();
 
          const xOffset = 18; // optional tweak
          const yOffset = size * 1; // 🔧 dynamic vertical alignment
 
          // Apply dynamic offset
          const centerX = anno.x + xOffset;
          const centerY = pageHeight - anno.y - yOffset;
 
          const color = rgb(1, 0, 0); // Red
 
          // Diagonal lines of the "X"
          const line1Start = { x: centerX - halfSize, y: centerY - halfSize };
          const line1End = { x: centerX + halfSize, y: centerY + halfSize };
 
          const line2Start = { x: centerX - halfSize, y: centerY + halfSize };
          const line2End = { x: centerX + halfSize, y: centerY - halfSize };
 
          // Draw the two crossing lines
          page.drawLine({
            start: line1Start,
            end: line1End,
            thickness,
            color,
          });
 
          page.drawLine({
            start: line2Start,
            end: line2End,
            thickness,
            color,
          });
 
          // Rounded ends
          const drawCircle = (x, y) => {
            page.drawCircle({
              x,
              y,
              size: radius,
              color,
            });
          };
 
          [line1Start, line1End, line2Start, line2End].forEach(({ x, y }) =>
            drawCircle(x, y)
          );
        } else if (anno.type === "trash") {
          page.drawText("�", {
            x: anno.x,
            y: page.getHeight() - anno.y,
            size: 20,
            color: rgb(1, 0, 0),
          });
        } else if (anno.type === "question") {
          const offsetX = -5; // small tweak to center or align nicely
          const offsetY = 35;
 
          page.drawText("?", {
            x: anno.x - offsetX,
            y: page.getHeight() - anno.y - offsetY,
            size: 40,
            color: rgb(1, 0, 0),
          });
        } else if (anno.type === "pen" && anno.path) {
          const pathPoints = anno.path;
          for (let i = 0; i < pathPoints.length - 1; i++) {
            const startPoint = pathPoints[i];
            const endPoint = pathPoints[i + 1];
            page.drawLine({
              start: {
                x: pathPoints[i].x,
                y: page.getHeight() - pathPoints[i].y,
              },
              end: {
                x: pathPoints[i + 1].x,
                y: page.getHeight() - pathPoints[i + 1].y,
              },
              thickness: startPoint.size || 2,
              color: hexToRgb(startPoint.color || "#FF0000"),
              opacity:
                startPoint.opacity !== undefined ? startPoint.opacity : 1,
            });
          }
        } else if (anno.type === "text") {
          const fontSize = anno.size || 16;
          const lineHeight = fontSize * 1.2;
          const maxWidth = anno.width || 200;
          const maxHeight = anno.height || 50;
          const text = anno.text || "";
          const color = hexToRgb(anno.color || "#000000");
 
          const font = await pdfDoc.embedFont("Helvetica");
          const words = text.split(" ");
          let lines = [];
          let currentLine = "";
 
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, fontSize);
            if (width <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
 
          let yOffset = page.getHeight() - anno.y;
          for (let i = 0; i < lines.length; i++) {
            const lineY = yOffset - i * lineHeight;
            if (lineY - fontSize >= page.getHeight() - anno.y - maxHeight) {
              page.drawText(lines[i], {
                x: anno.x,
                y: lineY - 35,
                size: fontSize,
                color: color,
                font: font,
              });
            } else {
              break;
            }
          }
        }
      }
 
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const newPdfUrl = URL.createObjectURL(blob);
      setCurrentPdfUrl(newPdfUrl);
 
      setAnnotationsByPdf((prev) => ({ ...prev, [currentPdfId]: [] }));
      setUndoStack([]);
 
      const filename = `${selectedStudentRoll}.pdf`;
      const formData = new FormData();
      formData.append("pdf", blob, filename);
      formData.append("studentRoll", selectedStudentRoll);
 
      const saveResponse = await fetch("https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/api/PdfScriptHandle/save", {
        method: "POST",
        body: formData,
      });
      const data = await saveResponse.json();
      if (saveResponse.ok) {
        // Update student status to finished
        setStudentStatuses((prev) => {
          const updated = { ...prev, [selectedStudentRoll]: "finished" };
          saveToLocalStorage(`studentStatuses_${userData.id}`, updated);
          return updated;
        });
        setSavedStates((prev) => {
          const updated = {
            ...prev,
            [selectedStudentRoll]: {
              ...prev[selectedStudentRoll],
              isSaved: true,
              annotations: [],
            },
          };
          // saveToLocalStorage(`correctionStates_${userData.id}`, updated);
          return updated;
        });
 
        // Check if all students are finished and force all_corrected status
        const allFinished = staticStudents.every(
          (student) =>
            student.StudId === selectedStudentRoll ||
            studentStatuses[student.StudId] === "finished"
        );
        if (allFinished) {
          setStudentStatuses((prev) => {
            const updated = {};
            staticStudents.forEach((student) => {
              updated[student.StudId] = "all_corrected";
            });
            saveToLocalStorage(`studentStatuses_${userData.id}`, updated);
            return updated;
          });
          const bundleStatuses = JSON.parse(
            localStorage.getItem(`bundleStatuses_${userData.id}`) || "{}"
          );
          bundleStatuses[BUNDLE_ID] = "finished";
          saveToLocalStorage(`bundleStatuses_${userData.id}`, bundleStatuses);
        }
 
        return true;
      } else {
        throw new Error(data.message || "Failed to save PDF to backend");
      }
    } catch (error) {
      alert(`Error saving PDF: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedStudentRoll,
    currentPdfId,
    annotationsByPdf,
    userId,
    saveToLocalStorage,
    staticStudents,
  ]);
 
  const handleGetSavedPdf = async () => {
    if (!selectedStudentRoll) {
      alert("Please select a student roll number first!");
      return;
    }
 
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://beesprod.beessoftware.cloud/CloudilyaAPIDeveloper/corrections/${selectedStudentRoll}`
      );
      if (!response.ok) throw new Error("Saved PDF not found");
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setCurrentPdfUrl(url);
      setAnnotationsByPdf((prev) => ({ ...prev, [currentPdfId]: [] }));
      setUndoStack([]);
    } catch (error) {
      alert(`Error fetching saved PDF: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleGetOriginalPdf = async () => {
    if (!selectedStudentRoll) {
      alert("Please select a student roll number first!");
      return;
    }
 
    setIsLoading(true);
    try {
      const originalPdfUrl = `https://localhost:7025/uploads/${selectedStudentRoll}`;
     
      setCurrentPdfUrl(originalPdfUrl);
      setAnnotationsByPdf((prev) => ({ ...prev, [currentPdfId]: [] }));
      setUndoStack([]);
    } catch (error) {
      alert(`Error loading original PDF: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
 
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
 
  const handleBack = () => navigate(`/home/${userData.id}`);
 
  const handleStudentSelect = (rollNumber) => {
    if (rollNumber === selectedStudentRoll) {
      return;
    }
    setPendingStudentRoll(rollNumber);
    if (selectedStudentRoll && annotationsByPdf[currentPdfId]?.length > 0) {
      setIsSaveNoteVisible(true);
    } else {
      checkAndLoadStudent(rollNumber);
    }
    setStudentStatuses((prev) => {
      const updated = {
        ...prev,
        [rollNumber]:
          prev[rollNumber] === "not_attempted" 
          
            ? "visited"
            : prev[rollNumber],
        ...(selectedStudentRoll && {
          [selectedStudentRoll]:
            prev[selectedStudentRoll] === "currently_working"
              ? annotationsByPdf[currentPdfId]?.length > 0
                ? "annotated"
                : "visited"
              : prev[selectedStudentRoll],
        }),
      };
      saveToLocalStorage(`studentStatuses_${userData.id}`, JSON.stringify(updated));
      return updated;
    });
  };
 
  const handleSaveNoteOk = () => {
    setIsSaveNoteVisible(false);
    if (pendingStudentRoll) {
      checkAndLoadStudent(pendingStudentRoll);
    }
  };
 
  const checkAndLoadStudent = (rollNumber) => {
    const savedState = savedStates[rollNumber];
    if (
      savedState &&
      (savedState.annotations.length > 0 ||
        savedState.timer.elapsedTime > 0 ||
        savedState.isSaved)
    ) {
      setIsContinueCorrectionModalVisible(true);
    } else {
      setIsSwitchModalVisible(true);
    }
  };
 
  const loadStudent = (rollNumber) => {
    if (selectedStudentRoll) {
      setTimers((prev) => ({
        ...prev,
        [selectedStudentRoll]: {
          ...prev[selectedStudentRoll],
          isRunning: false,
          startTime: null,
        },
      }));
    }
 
    setSelectedStudentRoll(rollNumber);
    setStudentStatuses((prev) => {
      const updated = { ...prev, [rollNumber]: "currently_working" };
      localStorage.setItem(
        `studentStatuses_${userData.id}`,
        JSON.stringify(updated)
      );
      return updated;
    });
    const savedState = savedStates[rollNumber];
    if (savedState) {
      setAnnotationsByPdf((prev) => ({
        ...prev,
        [`1234_${rollNumber}`]: savedState.annotations,
      }));
      setTimers((prev) => ({
        ...prev,
        [rollNumber]: {
          elapsedTime: savedState.timer.elapsedTime,
          isRunning: true,
          startTime: Date.now() - savedState.timer.elapsedTime * 1000,
        },
      }));
      setPageNum(savedState.pageNum);
      setScores(savedState.scores);
      setVisitedPages(new Set(savedState.visitedPages));
    } else {
      setTimers((prev) => ({
        ...prev,
        [rollNumber]: {
          elapsedTime: 0,
          isRunning: true,
          startTime: Date.now(),
        },
      }));
      setPageNum(1);
      setAnnotationsByPdf((prev) => ({
        ...prev,
        [`1234_${rollNumber}`]: [],
      }));
      setVisitedPages(new Set());
    }
  };
 
  const handleSwitchContinue = () => {
    setIsSwitchModalVisible(false);
    if (pendingStudentRoll) {
      loadStudent(pendingStudentRoll);
      setPendingStudentRoll(null);
    }
  };
 
  // Updated handleSwitchExit function
const handleSwitchExit = () => {
  setIsSwitchModalVisible(false);
  setPendingStudentRoll(null);
  if (selectedStudentRoll) {
    setTimers((prev) => {
      const updated = {
        ...prev,
        [selectedStudentRoll]: {
          ...prev[selectedStudentRoll],
          isRunning: true,
          startTime: Date.now() - (prev[selectedStudentRoll]?.elapsedTime || 0) * 1000,
        },
      };
     
      return updated;
    });
    setStudentStatuses((prev) => {
      const updated = {
        ...prev,
        [selectedStudentRoll]: "currently_working",
      };
      localStorage.setItem(`studentStatuses_${userId}`, JSON.stringify(updated));
     
      return updated;
    });
    setForceButtonRender((prev) => prev + 1); // Force button re-render
  } else {
    console.warn("handleSwitchExit: No selectedStudentRoll");
  }
};
 
  const handleContinueCorrection = () => {
    setIsContinueCorrectionModalVisible(false);
    if (pendingStudentRoll) {
      loadStudent(pendingStudentRoll);
      setPendingStudentRoll(null);
    }
  };
 
  const handleLogout = useCallback(() => {
    // Save pending student status before logout
    if (selectedStudentRoll) {
      setTimers((prev) => ({
        ...prev,
        [selectedStudentRoll]: {
          ...prev[selectedStudentRoll],
          isRunning: false,
          startTime: null,
        },
      }));
      setStudentStatuses((prev) => {
        const updated = {
          ...prev,
          [selectedStudentRoll]:
            annotationsByPdf[currentPdfId]?.length > 0
              ? "pending"
              : prev[selectedStudentRoll] === "currently_working"
              ? "visited"
              : prev[selectedStudentRoll],
        };
        saveToLocalStorage(`studentStatuses_${userData.id}`, updated);
        return updated;
      });
    }
 
    // localStorage.removeItem(`correctionStates_${userData.id}`);
    localStorage.removeItem(`studentStatuses_${userData.id}`);
 
    // Navigate to login with replace to clear history
    // Use setTimeout to ensure state updates are processed
    setSelectedStudentRoll(null);
    setCurrentPdfUrl(null);
    setAnnotationsByPdf({});
    setScores([]);
    setPageNum(1);
    setVisitedPages(new Set());
    navigate("/login", { replace: true });
  }, [
    selectedStudentRoll,
    annotationsByPdf,
    currentPdfId,
    userData.id,
    navigate,
    saveToLocalStorage,
  ]);
 
  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setSelectedMark(null);
    setSelectedTool(null);
    setIsEditingText(false);
  };
 
  const handleMarkSelect = (mark) => {
    console.log(mark)
    if (selectedQuestion === null) {
      alert("Please select a question first!");
      return;
    }
    const questionData = scores.find((q) => q.question === selectedQuestion);
    const currentTotalForQuestion = (annotationsByPdf[currentPdfId] || [])
      .filter(
        (anno) => anno.type === "mark" && anno.question === selectedQuestion
      )
      .reduce((sum, anno) => sum + anno.mark, 0);
    
    if (currentTotalForQuestion + mark > questionData.outOf) {
      alert(
        `Total marks (${currentTotalForQuestion + mark}) exceed the maximum (${
          questionData.outOf
        }) for question ${selectedQuestion}!`
      );
      return;
    }
    setSelectedMark(mark);
    setSelectedTool(null);
    setIsEditingText(false);
  };
 
  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    setSelectedMark(null);
    setSelectedQuestion(null);
    setIsEditingText(false);
    if (tool !== "text") setTextInput("");
  };
 
  const handleEditScore = (question) => setEditingQuestion(question);
 
  const handleScoreChange = (question, value) => {
    const newScore = parseFloat(value) || 0;
    const questionData = scores.find((q) => q.question === question);
    if (newScore > questionData.outOf) {
      alert(
        `Score (${newScore}) exceeds the maximum (${questionData.outOf}) for question ${question}!`
      );
      return;
    }
    setScores((prevScores) =>
      prevScores.map((item) =>
        item.question === question
          ? { ...item, score: newScore, isComplete: newScore >= item.outOf }
          : item
      )
    );
    const markAnnotations = (annotationsByPdf[currentPdfId] || []).filter(
      (anno) => anno.type === "mark" && anno.question === question
    );
    if (markAnnotations.length > 0) {
      const remainingScore = newScore;
      setAnnotationsByPdf((prev) => {
        let updatedAnnotations = [...(prev[currentPdfId] || [])];
        updatedAnnotations = updatedAnnotations.filter(
          (anno) => !(anno.type === "mark" && anno.question === question)
        );
        if (remainingScore > 0) {
          updatedAnnotations.push({
            ...markAnnotations[0],
            mark: remainingScore,
          });
        }
        return { ...prev, [currentPdfId]: updatedAnnotations };
      });
    }
  };
 
  const handleScoreUpdate = (question) => {
    setEditingQuestion(null);
  };
 
  const handleScoreKeyPress = (question, e) => {
    if (e.key === "Enter") handleScoreUpdate(question);
  };
 
  // CHANGE: Modified to initiate in-place editing instead of prompting
  const handleEditPageMark = (question, annotationId, currentMark) => {
    setEditingAnnotationId(annotationId);
    setEditMarkValue(currentMark.toString());
  };
 
  // CHANGE: Added handler for updating edit mark value
  const handleEditMarkChange = (e) => {
    setEditMarkValue(e.target.value);
  };
 
  // CHANGE: Added handler to save the edited mark
  const handleEditMarkSave = (question, annotationId) => {
    const newMark = parseFloat(editMarkValue) || 0;
    const questionData = scores.find((q) => q.question === question);
    const currentAnnotations = annotationsByPdf[currentPdfId] || [];
    const currentTotalMarks = currentAnnotations
      .filter(
        (anno) =>
          anno.type === "mark" &&
          anno.question === question &&
          anno.id !== annotationId
      )
      .reduce((sum, anno) => sum + anno.mark, 0);
    const newTotalMarks = currentTotalMarks + newMark;
 
    if (newTotalMarks > questionData.outOf) {
      alert(
        `Total marks (${newTotalMarks}) exceed the maximum (${questionData.outOf}) for question ${question}!`
      );
      return;
    }
 
    setAnnotationsByPdf((prev) => ({
      ...prev,
      [currentPdfId]: prev[currentPdfId].map((anno) =>
        anno.id === annotationId ? { ...anno, mark: newMark } : anno
      ),
    }));
 
    setScores((prevScores) =>
      prevScores.map((item) =>
        item.question === question
          ? {
              ...item,
              score: newTotalMarks,
              isComplete: newTotalMarks >= item.outOf,
            }
          : item
      )
    );
 
    setEditingAnnotationId(null);
    setEditMarkValue("");
    setHoveredQuestion(null);
  };
 
  // CHANGE: Added handler for saving mark on Enter key press
  const handleEditMarkKeyPress = (question, annotationId, e) => {
    if (e.key === "Enter") {
      handleEditMarkSave(question, annotationId);
    }
  };
 
  const onDocLoad = (pdf) => {
    setNumPages(pdf.numPages);
  };
 
  const marks = Array.from({ length: 21 }, (_, i) => i / 2);
  const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
  const totalPossible = scores.reduce((sum, item) => sum + item.outOf, 0);
  // const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);
  const pageNumbers = Array.from({ length: 30 }, (_, i) => i + 1);
 
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };
 
  const showModal = () => setVisible(true);
  const handleOk = () => setVisible(false);
 // Updated handleCancel function
const handleCancel = () => {
  setVisible(false);
  setIsContinueCorrectionModalVisible(false);
  setPendingStudentRoll(null);

  if (selectedStudentRoll) {
    // Stop the timer
    setTimers((prev) => {
      const updated = {
        ...prev,
        [selectedStudentRoll]: {
          ...prev[selectedStudentRoll],
          isRunning: false,
          startTime: null,
        },
      };
    
      return updated;
    });

    // Immediately resume the timer
    setTimers((prev) => {
      const updated = {
        ...prev,
        [selectedStudentRoll]: {
          ...prev[selectedStudentRoll],
          isRunning: true,
          startTime: Date.now() - (prev[selectedStudentRoll]?.elapsedTime || 0) * 1000,
        },
      };
    
      return updated;
    });

    // Set status to currently_working to maintain pink color
    setStudentStatuses((prev) => {
      const updated = {
        ...prev,
        [selectedStudentRoll]: "currently_working",
      };
      localStorage.setItem(`studentStatuses_${userData.id}`, JSON.stringify(updated));
     
      return updated;
    });

    setForceButtonRender((prev) => prev + 1); // Force button re-render
  } else {
    console.warn("handleCancel: No selectedStudentRoll");
  }
};
  const onStart = (event, uiData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };
 
  const toggleRightSidebar = () => setIsRightSidebarOpen((prev) => !prev);
 
  const handleResume = () => {
    setIsTimeoutModalVisible(false);
    setCountdown(COUNTDOWN_TIMEOUT);
    setTimers((prev) => ({
      ...prev,
      [selectedStudentRoll]: {
        ...prev[selectedStudentRoll],
        isRunning: true,
        startTime: Date.now() - prev[selectedStudentRoll].elapsedTime * 1000,
      },
    }));
    setLastActivityTime(Date.now());
    const savedState = savedStates[selectedStudentRoll];
    if (savedState) {
      setPageNum(savedState.pageNum);
    }
  };
 
  const handleExit = () => {
    setIsTimeoutModalVisible(false);
    setCountdown(COUNTDOWN_TIMEOUT);
    setTimers((prev) => ({
      ...prev,
      [selectedStudentRoll]: {
        ...prev[selectedStudentRoll],
        isRunning: false,
        startTime: null,
      },
    }));
    setStudentStatuses((prev) => {
      const updated = {
        ...prev,
        [selectedStudentRoll]:
          annotationsByPdf[currentPdfId]?.length > 0
            ? "pending"
            : prev[selectedStudentRoll],
      };
      localStorage.setItem(
        `studentStatuses_${userData.id}`,
        JSON.stringify(updated)
      );
      return updated;
    });
   
    // localStorage.removeItem(`correctionStates_${userData.id}`);
    localStorage.removeItem(`studentStatuses_${userData.id}`);
    setSelectedStudentRoll(null);
    setCurrentPdfUrl(null);
    setAnnotationsByPdf({});
    setScores([]);
    setPageNum(1);
    setVisitedPages(new Set());
    navigate("/login");
  };
 
  const getStudentButtonClass = (roll) => {
    const status = studentStatuses[roll];
    const isSelected = roll === selectedStudentRoll;
    switch (status) {
      case "all_corrected":
        return `bg-green-500 text-white hover:bg-green-600 ${
          isSelected ? "ring-2 ring-green-300" : ""
        }`;
      case "finished":
        return `bg-blue-500 text-white hover:bg-blue-600 ${
          isSelected ? "ring-2 ring-blue-300" : ""
        }`;
      case "currently_working":
        return `bg-pink-500 text-white hover:bg-pink-600 ${
          isSelected ? "ring-2 ring-pink-300" : ""
        }`;
      case "annotated":
        return `bg-orange-500 text-white hover:bg-orange-600 ${
          isSelected ? "ring-2 ring-orange-300" : ""
        }`;
      case "visited":
      case "not_attempted":
      default:
        return `bg-gray-500 text-white hover:bg-gray-600 ${
          isSelected ? "ring-2 ring-gray-300" : ""
        }`;
    }
  };
 
  if (!userData) {
    return <navigate to="/login" replace />;
  }
 
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            id="back-button"
            className="bg-purple-100 text-purple-800 p-1 rounded-full hover:bg-purple-200 hover:text-purple-900 hover:shadow-lg transition-all duration-300 shadow-sm"
            onClick={handleBack}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="flex items-center gap-20">
            <span className="bg-white text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-300 shadow-sm">
              Evaluator - {userData.name}
            </span>
            <span className="bg-white text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-300 shadow-sm">
              Subject: Demo1
            </span>
            <span className="bg-white text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-300 shadow-sm">
              User ID: {userData.id}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="bg-white text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-300 shadow-sm">
            Page Number: {pageNum}
          </span>
          <span className="bg-white text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-300 shadow-sm">
            Time Taken:{" "}
            {formatTime(timers[selectedStudentRoll]?.elapsedTime || 0)} / 30:00
          </span>
          <button
            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors duration-300 shadow-sm"
            onClick={startTour}
          >
            Guide Tutor
          </button>
          <button
            key="exit"
            className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors duration-300 shadow-sm"
            onClick={handleExit}
          >
            Logout
          </button>
        </div>
      </div>
 
      <div className="flex justify-evenly items-center p-6 bg-white">
        <div className="relative max-w-6xl w-full">
          {staticStudents.length > 0 && (
            <button
              className="absolute -left-14 top-1/2 -translate-y-1/2 text-gray-500 p-2 rounded-full duration-100 z-10"
              onClick={() =>
                document
                  .getElementById("student-container")
                  .scrollBy({ left: -200, behavior: "smooth" })
              }
            >
              <ChevronLeft />
            </button>
          )}
          <div
            id="student-container"
            className="flex overflow-x-auto gap-5 scrollbar-hide"
            style={{ scrollBehavior: "smooth", whiteSpace: "nowrap" }}
          >
            {staticStudents.map((student, index) => (
              <button
                className={`px-6 py-2 rounded-md flex-shrink-0 duration-100 ${getStudentButtonClass(
                  student.StudId
                )}`}
                key={index}
                onClick={() => handleStudentSelect(student.StudId)}
              >
                {student.StudId}
              </button>
            ))}
          </div>
          {staticStudents.length > 0 && (
            <button
              className="absolute -right-14 top-1/2 -translate-y-1/2 text-gray-500 p-2 rounded-full duration-100 z-10"
              onClick={() =>
                document
                  .getElementById("student-container")
                  .scrollBy({ left: 200, behavior: "smooth" })
              }
            >
              <ChevronRight />
            </button>
          )}
        </div>
        <div className="flex justify-center gap-6 ">
          <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-[rgb(59,130,245)] rounded-full"></span>
          <p className="text-sm text-gray-700">Saved</p>
          </div>
          <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-[rgb(237,74,155)] rounded-full"></span>
          <p>current</p>
          </div>
          <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-gray-500 rounded-full"></span>
          <p>Not Visited</p>
          </div>
          <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-[rgb(250,117,22)] rounded-full"></span>
          <p>Not Saved</p>
          </div>
        </div>
      </div>
 
      {isLoading && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-gray-700">Loading PDF...</p>
          </div>
        </div>
      )}
 
      {!selectedStudentRoll ? (
        // <div className="flex-1 flex justify-center items-center">
        //   <p className="text-lg text-gray-700">
        //     Please select a student roll number to begin evaluation.
        //   </p>
        // </div>
        <div className="flex-1 flex justify-center items-center h-screen overflow-hidden w-full relative">
          <img className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-500 hover:scale-105" src={image} alt=""/>
          <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <p className="text-3xl md:text-4xl text-white font-bold animate-pulse text-center px-4 drop-shadow-lg">
        Select a Student to Start the Evaluation!
      </p>
    </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl shadow-md border border-gray-200 p-4 flex flex-col items-center space-y-[650px] relative">
            <div className="w-full">
              <div
                id="marks-tools-dropdown"
                className="bg-gradient-to-r from-gray-50 to-purple-50 shadow-md border border-gray-200 text-gray-800 p-1 rounded flex items-center justify-between cursor-pointer"
                onClick={toggleDropdown}
              >
                <span>Marks & Tools</span>
                <FontAwesomeIcon icon={faCaretDown} />
              </div>
              {isDropdownOpen && (
                <div
                  className={`absolute mt-6 left-2 right-2 bg-gradient-to-r from-gray-50 to-purple-50 p-4 rounded-xl border border-gray-200 hover:border-gray-400 shadow-lg z-10 overflow-hidden transition-all duration-300 ease-in-out h-[700px] scrollbar-hide overflow-y-auto`}
                >
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {marks.map((mark) => (
                      <div
                        id={`mark-${mark}`}
                        key={mark}
                        className={`bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 rounded-full text-gray-800 hover:border-gray-700 cursor-pointer flex items-center justify-center ${
                          selectedMark === mark ? "ring-2 ring-yellow-500" : ""
                        }`}
                        onClick={() => handleMarkSelect(mark)}
                      >
                        {mark}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FontAwesomeIcon
                      id="tool-check"
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "check" ? "ring-2 ring-yellow-500" : ""
                      }`}
                      icon={faCheck}
                      onClick={() => handleToolSelect("check")}
                    />
                    <FontAwesomeIcon
                      id="tool-times"
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "times" ? "ring-2 ring-yellow-500" : ""
                      }`}
                      icon={faTimes}
                      onClick={() => handleToolSelect("times")}
                    />
                    <FontAwesomeIcon
                      id="tool-pen"
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "pen" ? "ring-2 ring-yellow-500" : ""
                      }`}
                      icon={faPen}
                      onClick={() => handleToolSelect("pen")}
                    />
                    <FontAwesomeIcon
                      id="tool-trash"
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "trash" ? "ring-2 ring-yellow-500" : ""
                      }`}
                      icon={faTrash}
                      onClick={() => handleToolSelect("trash")}
                    />
                    <FontAwesomeIcon
                      id="tool-text"
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "text" ? "ring-2 ring-yellow-500" : ""
                      }`}
                      icon={faComment}
                      onClick={() => handleToolSelect("text")}
                    />
                    <FontAwesomeIcon
                      id="tool-redo"
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "redo" ? "ring-2 ring-yellow-500" : ""
                      }`}
                      icon={faRedo}
                      onClick={handleRedo}
                    />
                    <FontAwesomeIcon
                      id="tool-undo"
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "undo" ? "ring-2 ring-yellow-500" : ""
                      }`}
                      icon={faUndo}
                      onClick={handleUndo}
                    />
                    <FontAwesomeIcon
                      id="tool-question"
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "question"
                          ? "ring-2 ring-yellow-500"
                          : ""
                      }`}
                      icon={faQuestion}
                      onClick={() => handleToolSelect("question")}
                    />
 
                    <FontAwesomeIcon
                      className={`flex items-center justify-center bg-gradient-to-r from-gray-50 to-purple-50 p-1 shadow-md border border-gray-200 hover:border-gray-700 rounded-full text-gray-800 cursor-pointer ${
                        selectedTool === "eraser"
                          ? "ring-2 ring-yellow-500"
                          : ""
                      }`}
                      icon={faEraser}
                      onClick={() => handleToolSelect("eraser")}
                    />
                  </div>
                  {selectedTool === "text" && (
                    <div className="mt-4 flex flex-col gap-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Enter text annotation..."
                        className="px-2 py-1 border rounded"
                      />
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-8 h-8 p-0 border-none cursor-pointer"
                        title="Select text color"
                      />
                      <select
                        value={textSize}
                        onChange={(e) => setTextSize(Number(e.target.value))}
                        className="px-2 py-1 border rounded cursor-pointer"
                        title="Select text size"
                      >
                        {[12, 16, 20, 24].map((size) => (
                          <option key={size} value={size}>
                            {size}px
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
 
          <div id="pdf-viewer-container" className="flex-1 p-4">
            <Viewer
              pageNum={pageNum}
              onPageChange={setPageNum}
              onLoadSuccess={handlePageLoad}
              annotations={annotationsByPdf[currentPdfId] || []}
              onClick={handlePdfClick}
              onFreehandDraw={handleFreehandDrawing}
              selectedTool={selectedTool}
              pdfId={currentPdfId}
              file={currentPdfUrl}
              onEditingChange={setIsEditingText}
              onSaveCopy={handleSaveCopy}
              onGetSavedPdf={handleGetSavedPdf}
              onGetOriginalPdf={handleGetOriginalPdf}
              toggleRightSidebar={toggleRightSidebar}
              onUpdateMarks={handleUpdateMarks}
              selectedStudentRoll={selectedStudentRoll}
              zoomScale={zoomScale}
              setZoomScale={setZoomScale}
            />
          </div>
 
          <div
            className={`bg-gray-200 p-4 w-1/4 flex flex-col space-y-4 scrollbar-hide transition-all duration-300 ${
              isRightSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div id="marks-table" className="bg-white p-4 rounded-lg shadow-md">
              <div className="overflow-hidden">
                <table className="border-collapse w-full text-center">
                  <thead>
                    <tr className="bg-gray-200 text-sm text-gray-700 font-semibold">
                      <th className="p-3 w-[15%] rounded-tl-md">
                        Mark Complete
                      </th>
                      <th className="p-3 ">Questions</th>
                      <th className="p-3">Out of</th>
                     
                      <th className="p-3 ">Marks</th>
                    </tr>
                  </thead>
                </table>
 
                <div className="max-h-80 overflow-y-auto scrollbar-hide">
                  <table className="border w-full text-center">
                    <tbody>
                      {scores.map((item, index) => {
                        const isLastRow = index === scores.length - 1;
                        return (
                          <tr
                            key={item.question}
                            className={`border-t border-gray-200 cursor-pointer transition-colors duration-200 relative ${
                              item.isComplete
                                ? "bg-green-200"
                                : selectedQuestion === item.question
                                ? "bg-yellow-100"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            onMouseEnter={() =>
                              setHoveredQuestion(item.question)
                            }
                            onMouseLeave={() => setHoveredQuestion(null)}
                            onClick={() => handleQuestionSelect(item.question)}
                          >
                            <td className="p-3 ">
                              <input
                                type="checkbox"
                                checked={item.isComplete}
                                onChange={() =>
                                  handleCheckboxChange(item.question)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="mx-auto block"
                              />
                            </td>
                            <td className="p-3 ">{item.question}</td>
                           
                            <td className="p-3  text-left">
                              {item.outOf}
                            </td>
                            <td className="p-3  flex justify-center items-center gap-2">
                              {editingQuestion === item.question ? (
                                <input
                                  type="number"
                                  className="border text-center w-16 p-1 rounded"
                                  value={item.score}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      item.question,
                                      e.target.value
                                    )
                                  }
                                  onKeyPress={(e) =>
                                    handleScoreKeyPress(item.question, e)
                                  }
                                  onBlur={() =>
                                    handleScoreUpdate(item.question)
                                  }
                                  min={0}
                                  max={item.outOf}
                                  step={0.5}
                                  autoFocus
                                />
                              ) : (
                                <span>{item.score}</span>
                              )}
                            </td>
 
                            {hoveredQuestion === item.question && (
                              <div
                                className={`absolute right-0 ${
                                  isLastRow
                                    ? "bottom-full mb-1"
                                    : "top-full mt-1"
                                } bg-white border border-gray-300 rounded shadow-lg p-2 z-50`}
                                style={{ minWidth: "200px" }}
                              >
                                {getQuestionPages(item.question).length > 0 ? (
                                  getQuestionPages(item.question).map(
                                    (qp, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded"
                                      >
                                        {editingAnnotationId === qp.id ? (
                                          <div className="flex items-center">
                                            <button
                                              className="text-left flex-1"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPageNum(qp.page);
                                                setHoveredQuestion(null);
                                              }}
                                            >
                                              Q{item.question} Page {qp.page}:
                                            </button>
                                            <input
                                              type="number"
                                              className="border text-center w-16 p-1 rounded ml-2"
                                              value={editMarkValue}
                                              onChange={handleEditMarkChange}
                                              onKeyPress={(e) =>
                                                handleEditMarkKeyPress(
                                                  item.question,
                                                  qp.id,
                                                  e
                                                )
                                              }
                                              onBlur={() =>
                                                handleEditMarkSave(
                                                  item.question,
                                                  qp.id
                                                )
                                              }
                                              min={0}
                                              max={item.outOf}
                                              step={0.5}
                                              autoFocus
                                            />
                                          </div>
                                        ) : (
                                          <>
                                            <button
                                              className="text-left flex-1"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPageNum(qp.page);
                                                setHoveredQuestion(null);
                                              }}
                                            >
                                              Q{item.question} Page {qp.page}:{" "}
                                              {qp.mark}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditPageMark(
                                                  item.question,
                                                  qp.id,
                                                  qp.mark
                                                );
                                              }}
                                              className="text-blue-500 hover:text-blue-700 ml-2"
                                            >
                                              <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )
                                  )
                                ) : (
                                  <div className="px-2 py-1 text-gray-500">
                                    No marks assigned yet
                                  </div>
                                )}
                              </div>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
 
                <table className="border-collapse w-full">
                  <tbody>
                    <tr className="border-t border-gray-300 font-semibold bg-gray-200">
                      <td colSpan="5" className="p-3 text-center">
                        Total Score: {`${totalScore}/${totalPossible}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
 
            <div
              id="page-numbers"
              className="bg-white p-4 rounded-lg shadow-md min-w-[400px]"
            >
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">
                  Page Numbers
                </span>
                <span className="font-semibold text-gray-700">
                  Visited/Not Visited
                </span>
              </div>
              <div className="grid grid-cols-10 gap-2 h-24 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {pageNumbers.map((page) => (
                  <span
                    key={page}
                    className={`m-1 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer text-sm font-medium transition-colors duration-200
                      ${
                        page === pageNum
                          ? "bg-yellow-500 text-white shadow-md"
                          : visitedPages.has(page)
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                      }`}
                    onClick={() => handlePageNumberClick(page)}
                  >
                    {page}
                  </span>
                ))}
              </div>
            </div>
 
            <div
              id="question-answer-bank"
              className="bg-white p-2 rounded shadow"
            >
              <QuestionAnswerBank
                showModal={showModal}
                activePdfType="answerSheet"
                setActivePdfType={() => {}}
                pageNum={pageNum}
                onLoadSuccess={handlePageLoad}
              />
            </div>
            <FinishEvaluation
              bundleId={BUNDLE_ID}
              onFinish={handleSaveCopy}
              userId={userData.id}
              navigate={navigate}
              studentStatuses={studentStatuses}
              staticStudents={staticStudents}
            />
          </div>
        </div>
      )}
 
      {visible && (
        <Rnd
          default={{
            x: (document.body.clientWidth - 800) / 2,
            y: 50,
            width: 800,
            height: 600,
          }}
          minWidth={300}
          minHeight={300}
          maxWidth={1200}
          maxHeight={900}
          enableResizing={{ top: true, right: true, bottom: true, left: true }}
          dragHandleClassName="modal-header"
          bounds="window"
          style={{
            zIndex: 1000,
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
          }}
        >
          <div
            className="modal-header"
            style={{
              width: "100%",
              cursor: "move",
              padding: "8px",
              background: "#f0f0f0",
              textAlign: "center",
              fontWeight: "bold",
              borderBottom: "1px solid #e8e8e8",
            }}
          >
            PDF Viewer
            <button
              onClick={handleCancel}
              style={{
                position: "absolute",
                right: "10px",
                top: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ✕
            </button>
          </div>
          <div
            ref={draggleRef}
            style={{
              width: "100%",
              height: "calc(100% - 40px)",
              overflowY: "auto",
              padding: "8px",
            }}
          >
            <Document
              file={currentPdfUrl}
              onLoadSuccess={onDocLoad}
              className="flex flex-col justify-start items-center w-full scrollbar-hide"
            >
              {Array.from(new Array(numPages), (_, index) => (
                <div
                  key={index}
                  className="border-[4px] border-gray-300 cursor-default relative rounded-lg my-4 shadow-sm"
                  style={{ width: "100%" }}
                >
                  <Page
                    pageNumber={index + 1}
                    width={draggleRef.current?.offsetWidth - 40}
                    height={draggleRef.current?.offsetHeight - 80}
                  />
                </div>
              ))}
            </Document>
          </div>
        </Rnd>
      )}
 
      {isSaveNoteVisible && (
        <Modal
          title="Save Reminder"
          open={isSaveNoteVisible}
          footer={[
            <button
              key="ok"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              onClick={handleSaveNoteOk}
            >
              OK
            </button>,
          ]}
          closable={false}
          centered
        >
          <p>
            Please save your corrections before switching to another student.
          </p>
        </Modal>
      )}
 
      {isTimeoutModalVisible && (
        <Modal
          title="Screen Timeout"
          open={isTimeoutModalVisible}
          footer={[
            <button
              key="resume"
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600 transition-colors"
              onClick={handleResume}
            >
              Resume
            </button>,
            <button
              key="exit"
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              onClick={handleExit}
            >
              Exit
            </button>,
          ]}
          closable={false}
        >
          <p>
            You've been inactive for {INACTIVITY_TIMEOUT} seconds. You have{" "}
            {formatTime(countdown)} remaining to resume or log out. If no action
            is taken, you will be logged out automatically.
          </p>
        </Modal>
      )}
 
      {isSwitchModalVisible && (
        <Modal
          title="Switch Student"
          open={isSwitchModalVisible}
          footer={[
            <button
              key="continue"
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600 transition-colors"
              onClick={handleSwitchContinue}
            >
              Continue
            </button>,
            <button
              key="exit"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              onClick={handleSwitchExit}
            >
              Exit
            </button>,
          ]}
          closable={false}
        >
          <p>
            You are currently correcting for student {selectedStudentRoll}. Do
            you want to switch to student {pendingStudentRoll} or stay with the
            current student?
          </p>
        </Modal>
      )}
 
      {isContinueCorrectionModalVisible && (
        <Modal
          title="Continue Correction"
          open={isContinueCorrectionModalVisible}
          footer={[
            <button
              key="continue"
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600 transition-colors"
              onClick={handleContinueCorrection}
            >
              Continue Correction
            </button>,
            <button
              key="logout"
              className="bg-red-500 text-white px-4 py-2 rounded mr-2 hover:bg-red-600 transition-colors"
              onClick={handleLogout}
            >
              Logout
            </button>,
          ]}
          closable={true}
          closeIcon={
            <XIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          }
          onCancel={handleCancel}
        >
          <p>
            You have a previous correction session for student{" "}
            {pendingStudentRoll} with{" "}
            {formatTime(
              timers[pendingStudentRoll]?.elapsedTime ||
                savedStates[pendingStudentRoll]?.timer.elapsedTime ||
                0
            )}{" "}
            elapsed. Would you like to continue or log out.
          </p>
        </Modal>
      )}
    </div>
  );
};
 
export default BundleCorrection;
