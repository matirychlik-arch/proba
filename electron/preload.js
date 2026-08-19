'use strict'

const { contextBridge, ipcRenderer } = require('electron')

/**
 * Most między natywną powłoką a UI. Minimalna powierzchnia — renderer nie
 * dostaje dostępu do Node ani do systemu plików, tylko do tych dwóch operacji.
 */
contextBridge.exposeInMainWorld('proba', {
  isDesktop: true,
  /** Otwiera natywne okno wyboru pliku. Zwraca ścieżkę albo null. */
  pickVideo: () => ipcRenderer.invoke('proba:pickVideo'),
})
