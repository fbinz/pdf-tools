import React, {useState} from 'react';
import {DndProvider, useDrop} from "react-dnd";
import {HTML5Backend, NativeTypes} from "react-dnd-html5-backend";
import * as pdfjs from "pdfjs-dist/webpack";
import './tailwind.output.css';
import produce from "immer";
import * as PDFLib from "pdf-lib";
import {PNG} from 'pngjs/browser';
import Viewer from './Viewer2';
import {useAsyncEffect} from "./util";

function WorkArea(props) {
  const [pdfDoc, setPdfDoc] = useState();
  const [pdfFile, setPdfFile] = useState();
  const [pngFiles, setPngFiles] = useState([])

  async function loadPdf(file) {
    const url = URL.createObjectURL(file);
    const doc = await pdfjs.getDocument(url).promise;
    setPdfDoc(doc);
  }

  const [, drop] = useDrop({
    accept: NativeTypes.FILE,
    drop(item, monitor) {
      const files = item.files;
      if (files.length === 0) {
        return;
      }
      let imageFiles = [];
      for (const file of item.files) {
        if (file.name.endsWith('.pdf')) {
          setPdfFile(file);
          loadPdf(file);
        } else if (file.name.endsWith('.png')) {
          // Add to array of images
          imageFiles.push(file);
        }
      }
      setPngFiles(produce(draft => {
        draft.push(...imageFiles);
        draft.sort(file => file.name);
      }))
    }
  })

  function pdfDetails() {
    if (!pdfDoc) {
      return;
    }
    return <Details summary="Details" className="text-sm text-gray-600 ml-2">
      <span>{pdfFile.name}, {pdfFile.size} Bytes, {pdfDoc.numPages} pages</span>
    </Details>
  }

  useAsyncEffect(async () => {
    for (const file of pngFiles) {
      const data = await file.arrayBuffer();
      const png = new PNG({filterType: 4}).parse(data, (error, image) => {
        if (!error) {
          console.log(image);
        }
      });
    }
  }, [pngFiles]);

  function pngDetails() {
    if (!pngFiles.length) {
      return;
    }

    return <Details summary="Details" className="text-sm text-gray-600 ml-2">
      <span>{pngFiles.length}</span>
    </Details>
  }

  async function createFlipBook() {
    if (!pngFiles.length || !pdfFile) {
      return;
    }

    // load pdf document
    let pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(pdfBytes);
    const mergedPdf = await PDFLib.PDFDocument.create();

    const count = pdf.getPageCount();
    for (let i = 0; i < count; i++) {
      const pdfPage = mergedPdf.addPage();
      const embeddedPage = await mergedPdf.embedPage(pdf.getPage(i));

      if (i < pngFiles.length) {
        const picFile = pngFiles[i];
        const picBytes = await picFile.arrayBuffer();
        const embeddedImage = await mergedPdf.embedPng(picBytes);
        embeddedImage.scale(0.1);
        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: embeddedImage.width/2,
          height: embeddedImage.height/2,
        });
      }

      pdfPage.drawPage(embeddedPage);
    }

    pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], {type: 'application/pdf'});
    return URL.createObjectURL(blob);
  }

  async function previewFlipBook() {
    const url = await createFlipBook();
    const doc = await pdfjs.getDocument(url).promise;
    setPdfDoc(doc);
  }

  return <>
    <div ref={drop} className="flex w-screen h-screen bg-gray-100 p-12">
      <div className="flex flex-col mr-4">
        <h1 className="text-4xl text-gray-900 font-bold leading-tight">FlipBook<br/>
          <span className="text-2xl font-hairline">Get your thesis flipped through at least.</span>
        </h1>
        <ol className="list-decimal list-inside text-gray-700 text-xl font-light">
          <li className="pt-8 relative">Drop PDF {pdfDetails()}</li>
          <li className="pt-8">Drop PNGs {pngDetails()}</li>
          <li className="pt-8">Adjust (Move/Resize)</li>
          <li className="pt-8">Download</li>
          <li className="pt-8">Profit!</li>
          <li><button onClick={() => previewFlipBook()}>Test</button></li>
        </ol>
      </div>
      <div className="h-full w-2/3 bg-gray-200">
        <Viewer pdf={pdfDoc}/>
      </div>
    </div>
  </>
}

function Details(props) {
  const [open, setOpen] = useState(false);
  return <div className={(open ? "block " : "absolute ") + props.className}>
    <button className="hover:bg-gray-400" onClick={() => setOpen(!open)}>
      <span className="inline-block mr-1 w-2 text-center">{open ? '-' : '+'}</span>
      {props.summary}
    </button>
    <div className="ml-4">
      {open ? props.children : null}
    </div>
  </div>
}

export default props => {
  return <DndProvider backend={HTML5Backend}>
    <WorkArea />
  </DndProvider>
}