import {useState} from "react";

export function readFileAsync(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(`Could not read file named ${file.name}, error: ${reader.error}`);
    };
    reader.onload = () => {
      resolve(reader.result);
    }
    reader.readAsArrayBuffer(file);
  })
}

export function useNumber(initialValue, minValue, maxValue) {
  const [value, setValue] = useState(initialValue);
  return [value, (newValue) => {
    if (newValue < minValue) {
      setValue(minValue);
    } else if (newValue > maxValue) {
      setValue(maxValue);
    } else {
      setValue(newValue);
    }
  }]
}