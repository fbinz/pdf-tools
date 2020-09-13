import { PDFDocument } from 'pdf-lib';
import { readFileAsync } from './util';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

export class PdfDocument {
  constructor(file, pdfDoc) {
    this.file = file;
    this.pdfDoc = pdfDoc;
    this.id = uuid();
  }

  get pageCount() {
    return this.pdfDoc ? this.pdfDoc.getPageCount() : 0;
  }

  get name() {
    return this.file.name;
  }

  async load() {
    if (!this.pdfDoc) {
      const pdfBytes = await readFileAsync(this.file);
      this.pdfDoc = await PDFDocument.load(pdfBytes);
    }
  }

  static async copyPages(srcDoc, name, indices) {
    const destPdf = await PDFDocument.create();
    const embeddedPages = await destPdf.copyPages(srcDoc.pdfDoc, indices);
    for (const page of embeddedPages) {
      destPdf.addPage(page);
    }
    return new PdfDocument({name: name}, destPdf);
  }

  static async split(srcDoc, atPage) {
    atPage = _.clamp(atPage, 0, srcDoc.pageCount);
    return Promise.all([
      PdfDocument.copyPages(srcDoc, srcDoc.file.name + 'A', _.range(atPage)),
      PdfDocument.copyPages(srcDoc, srcDoc.file.name + 'B', _.range(atPage, srcDoc.pageCount))
    ])
  }

  static async extractPages(srcDoc, indices) {
    return PdfDocument.copyPages(srcDoc, srcDoc.file.name + '_extracted', indices)
  }

  static async merge(doc1, doc2) {
    const destPdf = await PDFDocument.create();
    async function copyAllPages(doc) {
      const embeddedPages = await destPdf.copyPages(doc.pdfDoc, doc.pdfDoc.getPageIndices())
      for (const page of embeddedPages) {
        destPdf.addPage(page);
      }
    }
    await copyAllPages(doc1);
    await copyAllPages(doc2);
    return new PdfDocument({name: doc1.file.name}, destPdf);
  }

  async blobUrl() {
    const pdfBytes = await this.pdfDoc.save();
    const blob = new Blob([pdfBytes], {type: "application/pdf"})
    return URL.createObjectURL(blob)
  }
}