import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './canvas.scss';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import ClassDiagramElementsEnum from '@enums/classDiagramElementsEnum';
import { drawNewElement } from 'store/actions/canvas';
import { isEqual } from 'lodash-es';

import IBaseElement from '@interfaces/elements/IBaseElement';
import Class from '@components/classDiagram/class';
import Association from '@components/classDiagram/association';
import IClassElement from '@interfaces/elements/IClassElement';
import IStoreState from '@interfaces/IStoreState';
import CanvasEnum from '@enums/storeActions/canvasEnum';
import IRelationElement from '@interfaces/elements/relation/IRelationElement';
import CanvasOperationEnum from '@enums/canvasOperationEnum';

function createElements(
        elementsProps: Array<IBaseElement>,
        updateCanvasOperation: React.Dispatch<React.SetStateAction<string>>,
        setCurrentlyDrawingRelation: React.Dispatch<React.SetStateAction<{
            x1: number;
            y1: number;
            x2: number;
            y2: number;
        }>>
    ) {

        return elementsProps.map((elementProps: IBaseElement, index: number) => {
        switch(elementProps.elementData.type) {
            case ClassDiagramElementsEnum.TABLE:
                let classElementProps = elementProps as IClassElement;
                classElementProps.elementFunctionality.onJointClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                    updateCanvasOperation(CanvasOperationEnum.DRAWING_NEW_RELATION);
                    setCurrentlyDrawingRelation({
                        x1: event.nativeEvent.offsetX,
                        y1: event.nativeEvent.offsetY,
                        x2: event.nativeEvent.offsetX,
                        y2: event.nativeEvent.offsetY
                    })
                };

                return <Class key={index} {...classElementProps}/>;
            case ClassDiagramElementsEnum.ASSOCIATION:
                const el = elementProps as IRelationElement;
                return (
                    <Association key={index} {...el}/>
                );
        }
    });
}

function Canvas() {
    const dispatch = useDispatch(); 
    const elements = useSelector((state: IStoreState) => state.canvas.elements, (left, right) => {
        return !isEqual(left, right);
    });
    
    const [canvasOperation, updateCanvasOperation] = React.useState('');
    const [currentlyDrawingRelation, setCurrentlyDrawingRelation] = React.useState({
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
    });
    
    const addNewElement = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.persist();
        const type = event.dataTransfer.getData('elementType') as CanvasEnum;
        dispatch(drawNewElement(type, { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY }));
    };

    const updateDrawingRelation = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.persist();

        let fixX = -0.5;
        let fixY = 0.5;
        if (currentlyDrawingRelation.y1 > event.nativeEvent.offsetY) {
            fixY = -0.5;
        }
        if (currentlyDrawingRelation.x1 > event.nativeEvent.offsetX) {
            let fixX = 0.5;
        }

        setCurrentlyDrawingRelation({
            x1: currentlyDrawingRelation.x1,
            y1: currentlyDrawingRelation.y1,
            x2: event.nativeEvent.offsetX - fixX,
            y2: event.nativeEvent.offsetY - fixY
        })
    }

    const stopDrawingRelation = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.persist();
        if ((event.target as any).nodeName === 'circle') {
            updateCanvasOperation(CanvasOperationEnum.NONE);
            dispatch(drawNewElement(CanvasEnum.ADD_NEW_ASSOCIATION, {
                x1: currentlyDrawingRelation.x1,
                y1: currentlyDrawingRelation.y1,
                x2: currentlyDrawingRelation.x2,
                y2: currentlyDrawingRelation.y2
            }));
            setCurrentlyDrawingRelation({
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            });
        }
    }

    const canvasMouseClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        switch(canvasOperation) {
            case 'DRAWING_NEW_RELATION':
                stopDrawingRelation(event);
                break;
            default:
                break;
        }
    };

    const canvasMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        switch(canvasOperation) {
            case 'DRAWING_NEW_RELATION':
                updateDrawingRelation(event);
                break;
            default:
                break;
        }
    };


    return (
        <div id='canvas' onClick={(ev) => canvasMouseClick(ev)} onMouseMove={(ev) => canvasMouseMove(ev)} onDragOver={(ev) => ev.preventDefault()} onDrop={(event) => addNewElement(event)}>
            <svg id='svg-canvas' width='100%' height='100%'>
                <g>
                    {...createElements(elements, updateCanvasOperation, setCurrentlyDrawingRelation)}
                </g>    
                <line stroke='black' x1={currentlyDrawingRelation.x1} x2={currentlyDrawingRelation.x2} y1={currentlyDrawingRelation.y1} y2={currentlyDrawingRelation.y2}/>
            </svg>
        </div>
    );
}

export default Canvas;