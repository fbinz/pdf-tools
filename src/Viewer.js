import React, {useRef, useEffect, useState} from 'react';
import * as pdfjs from 'pdfjs-dist/webpack';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.js';
import 'pdfjs-dist/web/pdf_viewer.css';
import './Viewer.css';
import './tailwind.output.css';

export default function({pdfDoc}) {
  const viewerContainerRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!viewerContainerRef) {
      return;
    }
    const eventBus = new pdfjsViewer.EventBus();
    const viewer = new pdfjsViewer.PDFSinglePageViewer({
      container: viewerContainerRef.current,
      eventBus: eventBus,
    });
    setViewer(viewer);
  }, [viewerContainerRef]);

  useEffect(() => {
    async function effect() {
      if (!viewer || !pdfDoc) {
        return;
      }
      viewer.setDocument(pdfDoc);
      viewer.currentScale = 0.85;
    }
    effect();
  }, [pdfDoc, viewer])

  function setPageNumber(pageNum) {
    if (!viewer || !pdfDoc) {
      return;
    }
    if (pageNum > 0 && pageNum <= viewer.pdfDocument.numPages) {
      setCurrentPage(pageNum);
      viewer.currentPageNumber = pageNum;
    }
  }

  const pageCount = (viewer && viewer.pdfDocument) ? viewer.pdfDocument.numPages : 0;
  const navigation = <div className="flex justify-start text-black bg-gray-600 p-1">
     <div className="bg-white border border-gray-200 rounded">
       <input type="number" value={currentPage} className="text-gray-900 mx-1 w-12 text-center" onChange={ev => setPageNumber(parseInt(ev.target.value))}/>
       <span className="px-2 text-gray-500">({currentPage} von {pageCount})</span>
     </div>
   </div>;

   return <div className="rounded">
     {pdfDoc ? navigation : null}
     <div ref={viewerContainerRef} className="w-full">
       <div className="pdfViewer"/>
     </div>
   </div>
}