import React, {useRef} from 'react';
import styled from "styled-components";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend, NativeTypes } from "react-dnd-html5-backend";

const StyledFileInputIcon = styled.div`
    display: inline-block;
    stroke-width: 0;
    stroke: black;
    fill: black;
    vertical-align: middle;
`

function FileInputIcon(props) {
    return <StyledFileInputIcon>
        <svg className="file-input-icon" xmlns="http://www.w3.org/2000/svg" aria-labelledby="title"
             viewBox="0 0 24 24" width={props.size} height={props.size}>
            <title id="title">File Input Icon</title>
            <path
                d="M8.016 15l3.984-3.984 3.984 3.984-1.406 1.453-1.594-1.594v4.125h-1.969v-4.125l-1.594 1.547zM18 20.016v-11.016h-5.016v-5.016h-6.984v16.031h12zM14.016 2.016l6 6v12q0 0.797-0.609 1.383t-1.406 0.586h-12q-0.797 0-1.406-0.586t-0.609-1.383l0.047-16.031q0-0.797 0.586-1.383t1.383-0.586h8.016z"/>
        </svg>
    </StyledFileInputIcon>
}

const StyledContainer = styled.div`
    display: flex;
    border-radius: 4px;
    padding: 2em;
    text-align: center;
    color: white;
    font-size: 12px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin: 0.5em;
    background-color: ${props => props.backgroundColor ? props.backgroundColor : 'lightgray'};
    border: 2px dashed ${props => props.borderColor ? props.borderColor : 'gray'};

`

const StyledButtonContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: black;
    font-weight: bold;
    padding: 1em;
    background-color: #fdfdfe;
    border-radius: 4px;
    margin: 1em;
`

function FileInputArea({inputId, accept, label, backgroundColor, borderColor, multiple, onChange}) {
    const inputRef = useRef(null);
    const [, drop] = useDrop({
        accept: NativeTypes.FILE,
        drop(item, monitor) {
            handleChange(item.files);
        },
        canDrop(item, monitor) {
            return multiple || item.files.length === 1;
        }
    })

    const handleChange = (files) => onChange ? onChange(files) : null;

    return <StyledContainer ref={drop} onClick={() => inputRef.current.click()}
                            borderColor={borderColor} backgroundColor={backgroundColor}>
        <StyledButtonContainer>
            <label htmlFor={inputId}><FileInputIcon size="2em"/>{label}</label>
            <br/>
        </StyledButtonContainer>
        <input ref={inputRef} type="file" id={inputId}
               style={{opacity: 0, height: 0}} multiple={multiple !== undefined}
               accept={accept}
               onChange={ev => handleChange(ev.target.files)}/>
        ...or drop here
    </StyledContainer>
}

export default function FileInput(props) {
    return <DndProvider backend={HTML5Backend}>
        <FileInputArea {...props}/>
    </DndProvider>
}
