import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
var MultiBackend = require('react-dnd-multi-backend').default;
var HTML5toTouch = require('react-dnd-multi-backend/lib/HTML5toTouch').default; // or any other pipeline


export default DragDropContext(MultiBackend(HTML5toTouch));