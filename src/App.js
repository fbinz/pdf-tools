import React, {useState} from 'react';
import {DndProvider, useDrop} from "react-dnd";
import {HTML5Backend, NativeTypes} from "react-dnd-html5-backend";
import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';
import './tailwind.output.css';
import produce from "immer";
import _ from 'lodash';
import {PdfDocument} from './pdfDocument';
import {useAsync} from 'react-async';
import {useNumber} from "./util";


function App() {
  return <div className="flex justify-center w-full">
    <div className="flex flex-col text-gray-800 items-center w-3/4">
      <h1 className="tracking-wider pt-10 text-center text-4xl">PDF-TOOLS</h1>
      <h2 className="text-center mb-10">no upload - just your browser</h2>
      <FileInput />
      <div className="flex w-full flow-row justify-between">
        <Button className="flex-1">Download All</Button>
      </div>
    </div>
  </div>
}

function FileInput() {
  const [pdfDocs, setPdfDocs] = useState([]);

  function onDrop(newFiles) {
    setPdfDocs(produce(draft => {
      for (const file of newFiles) {
        if (!_.find(draft, f => file.name === f.name)) {
          draft.push(new PdfDocument(file));
        }
      }
    }));
  }

  return <DndProvider backend={HTML5Backend}>
    <div className="w-full">
      <FileDropArea onDrop={(item, monitor) => onDrop(item.files)} canDrop={(item, monitor) => true}>
        <div className="p-10 items-center border-2 rounded-md border-dashed border-gray-500 bg-gray-300 hover:border-blue-500">
          <PdfDocumentList pdfDocs={pdfDocs} setPdfDocs={setPdfDocs}/>
        </div>
      </FileDropArea>
    </div>
  </DndProvider>
}

function FileDropArea(props) {
  const [, drop] = useDrop({
    accept: NativeTypes.FILE,
    drop(item, monitor) {
      props.onDrop(item, monitor);
    },
    canDrop(item, monitor) {
      return props.canDrop(item, monitor)
    },
  })

  return <div ref={drop}>
    {props.children}
  </div>
}

function PdfDocumentList({pdfDocs, setPdfDocs}) {

  function reorder(fromIdx, toIdx) {
    setPdfDocs(produce(draft => {
      const [removed] = draft.splice(fromIdx, 1);
      draft.splice(toIdx, 0, removed);
    }))
  }

  async function merge(base, toBeMerged) {
    const idxBase = _.findIndex(pdfDocs, d => d.name === base);
    const idxToBeMerged = _.findIndex(pdfDocs, d => d.name === toBeMerged);
    const mergedDoc = await PdfDocument.merge(pdfDocs[idxBase], pdfDocs[idxToBeMerged]);
    setPdfDocs(produce(draft => {
      draft[idxBase] = mergedDoc;
      draft.splice(idxToBeMerged, 1);
    }))
  }

  function onDragEnd(result) {
    // dropped inside list
    if (result.destination) {
      reorder(result.source.index, result.destination.index);
    }
    // dropped onto another element in list
    else if (result.combine) {
      merge(result.combine.draggableId, result.draggableId);
    }
  }

  return <DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId="droppable" isCombineEnabled>{(provided, snapshot) =>
      <div {...provided.droppableProps} ref={provided.innerRef}>{pdfDocs.map((pdfDoc, index) =>
        <Draggable key={pdfDoc.name} draggableId={pdfDoc.name} index={index}>{(provided, snapshot) =>
          <div className="relative w-full" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
            <PdfDocumentComponent doc={pdfDoc} setPdfDocs={setPdfDocs}/>
            {snapshot.combineTargetFor ? <div className="absolute inset-0 w-full h-full bg-blue-200 text-center opacity-50">
              <div className="text-sm">DROP TO MERGE</div>
            </div> : null}
          </div>}
        </Draggable>)}
        {provided.placeholder}
      </div>}
    </Droppable>
  </DragDropContext>
}

async function loadDoc({doc}, {signal}) {
  await doc.load();
}

function PdfDocumentComponent({doc, setPdfDocs}) {
  const {__, error, isPending} = useAsync({promiseFn: loadDoc, doc: doc});
  const [showExtractMenu, setShowExtractMenu] = useState(false);
  const [extractStart, setExtractStart] = useNumber(1, 1, 100);
  const [extractStop, setExtractStop] = useNumber(100, 1, 100);
  const [extractStep, setExtractStep] = useNumber(1, 1, 100);

  function ExtractMenu() {
    if (!showExtractMenu) {
      return null;
    }

    async function extractPages() {
      const indices = _.range(extractStart - 1, extractStop, extractStep);
      const newDoc = await PdfDocument.extractPages(doc, indices);
      setPdfDocs(produce(draft => {
        const idx = draft.indexOf(doc);
        draft.splice(idx, 1, newDoc);
      }))
    }

    return <div className="flex flex-col w-full">
      <hr className="my-2"/>
      <div className="flex justify-end">
        <div>
          <label htmlFor="extract-start">Start:</label>
          <input className="w-20" id="extract-start" name="extract-start" type="number" step={1}
                 onChange={ev => setExtractStart(ev.target.value)} value={extractStart}/>
          <label htmlFor="extract-stop">Stop:</label>
          <input className="w-20" id="extract-stop" name="extract-stop" type="number" step={1}
                 onChange={ev => setExtractStop(ev.target.value)} value={extractStop}/>
          <label htmlFor="extract-step">Step:</label>
          <input className="w-20" id="extract-step" name="extract-step" type="number" step={1}
                 onChange={ev => setExtractStep(ev.target.value)} value={extractStep}/>
          <Button type="submit" onClick={() => extractPages()}>Extract Pages</Button>
        </div>
      </div>
    </div>
  }

  async function split() {
    const [partA, partB] = await PdfDocument.split(doc, 10);
    setPdfDocs(produce(draft => {
      const idx = draft.indexOf(doc);
      draft.splice(idx, 1, partA, partB);
    }))
  }

  function remove() {
    setPdfDocs(produce(draft => {
      const idx = draft.indexOf(doc);
      draft.splice(idx, 1);
    }))
  }

  async function download() {
    const url = await doc.blobUrl();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download';
    const clickHandler = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.removeEventListener('click', clickHandler);
      }, 150);
    };
    a.addEventListener('click', clickHandler, false);
    a.click();
  }



  return <div className="flex flex-col rounded border border-gray-400 p-2 w-full bg-gray-200">
    <div className="flex items-center">
      <div className="flex-1">{doc.name} {isPending ? 'Loading....' : `(${doc.pageCount})`}</div>
      <Button className="text-sm ml-1" onClick={() => setShowExtractMenu(!showExtractMenu)}>EXTRACT</Button>
      <Button className="text-sm ml-1" onClick={() => split()}>SPLIT</Button>
      <Button className="text-sm ml-1" onClick={() => remove()}>REMOVE</Button>
      <Button className="text-sm ml-1" onClick={() => download()}>DOWNLOAD</Button>
    </div>
    {ExtractMenu()}
  </div>
}

function Button(props) {
  return <button className={"bg-gray-100 rounded border border-gray-400 p-1 " + (props.className ? props.className : "")}
                 {..._.omit(props, ['className', 'children'])}>
    {props.children}
  </button>
}


export default App;
