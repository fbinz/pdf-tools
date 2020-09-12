import React from "react";

export default function PdfInfo(props) {
  return <ul>
    <li>Filename: {props.doc.filename}</li>
    <li>Author: {props.doc.author}</li>
    <li>Pages: {props.doc.numPages}</li>
  </ul>
}
