import {DragDropContext} from 'react-dnd';
var MultiBackend = require('react-dnd-multi-backend').default;
var HTML5toTouch = require('react-dnd-multi-backend/lib/HTML5toTouch').default; // or any other pipeline

export default DragDropContext(MultiBackend(HTML5toTouch));