import React, {useEffect, useRef, useState} from "react";
import * as pdfjs from 'pdfjs-dist/webpack';
import {useAsyncEffect} from "./util";

export default function Viewer({pdf}) {
  const canvasRef = useRef();
  const [currentPageNumber, setCurrentPageNumber] = useState(1)
  const [isRendering, setIsRendering] = useState(false);

  useAsyncEffect(async () => {
    if (!pdf || isRendering) {
      return;
    }
    setIsRendering(true);
    const page = await pdf.getPage(currentPageNumber);
    const scale = 1.0;
    const viewport = page.getViewport({scale: scale});
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.height = viewport.height * 1.0;
    canvasRef.current.width = viewport.width * 1.0;
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    await page.render(renderContext).promise;
    setIsRendering(false);
  }, [pdf, currentPageNumber]);

  function setPageNumber(pageNum) {
    if (pageNum > 0 && pageNum <= pdf.numPages) {
      setCurrentPageNumber(pageNum);
    }
  }

  const pageCount = pdf ? pdf.numPages : 0;
  const navigation = <div className="flex justify-start text-black bg-gray-600 p-1">
    <div className="bg-white border border-gray-200 rounded">
      <input type="number" value={currentPageNumber} className="text-gray-900 mx-1 w-12 text-center" onChange={ev => setPageNumber(parseInt(ev.target.value))}/>
      <span className="px-2 text-gray-500">({currentPageNumber} von {pageCount})</span>
    </div>
  </div>;

  return <>
    {pdf ? navigation : null}
    <canvas ref={canvasRef}>
    </canvas>
  </>

}