import React from 'react';
import './Home.css';
import PdfInfo from "./PdfInfo";
import FileInput from "./FileInput";
import WorkArea from "./WorkArea";

const doc = {
  filename: 'diss.pdf',
  author: 'Fabian Binz',
  numPages: 2,
}

function ConvertForm(props) {
  return <form>

  </form>
}

export default function Home(props) {
  return <div id="home">
      <div id="header">
        <h1>FlipBook</h1>
        <h3>Let your thesis get flipped through at least…</h3>
      </div>
      <WorkArea/>
    </div>
}
