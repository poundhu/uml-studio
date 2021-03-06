import React from 'react';
import ReactDOM from 'react-dom';
import IInterfaceProps from '@interfaces/class-diagram/interface/IInterfaceProps';
import { useDispatch, useSelector } from 'react-redux';
import Frame from '../common/frame';
import IFrameFunctionality from '@interfaces/class-diagram/common/IFrameFunctionality';
import { selectNewElement, isMouseDown, newCanvasOperation } from '@store/actions/canvas.action';
import Joints from '../common/joints';
import FrameHead from '../common/frameHead';
import InterfaceHead from './interfaceHead';
import IFrameSegmentGraphicData from '@interfaces/class-diagram/common/IFrameSegmentGraphicData';
import FrameRow from '../common/frameRow';
import ClassAttribute from '../class/classAttribute';
import IInterfaceMethod from '@interfaces/class-diagram/interface/IInterfaceMethod';
import IInterfaceProperty from '@interfaces/class-diagram/interface/IInterfaceProperty';
import IClassAttribute from '@interfaces/class-diagram/class/IClassAttribute';
import IFrameRow from '@interfaces/class-diagram/common/IFrameRow';
import FrameSegment from '../common/frameSegment';
import IInterfaceHead from '@interfaces/class-diagram/interface/IInterfaceHead';
import CanvasOperationEnum from '@enums/canvasOperationEnum';
import Direction from '@enums/direction';
import IStoreState from '@interfaces/IStoreState';

const Interface = (props: IInterfaceProps) => {
    const dispatch = useDispatch();
    const [joints, setJoints] = React.useState(<g/>);
    const isMouseDownState = useSelector((state: IStoreState) => state.canvas.isMouseDown);
    const { frame, sections } = props.interface.graphicData;
    
    const createNewInterfaceRow = (index: number, classAttribute: IInterfaceMethod | IInterfaceProperty, y: number) => {
        const frameRowProps: IFrameRow = {
            graphicData: {
                index,
                x: frame.x,
                y,
                xCenter: frame.xCenter,
                rowHeight: frame.rowHeight,
                width: frame.width,
                fontPixelSize: frame.fontPixelSize,
            }
        };
        const classAttributeProps: IClassAttribute<IInterfaceMethod | IInterfaceProperty> = {
            data: classAttribute,
            graphicData: {
                text: {
                    x: frame.xCenter,
                    y: y + (index * frame.rowHeight) + frame.fontPixelSize
                }
            }
        };

        return (
            <FrameRow key={index} frameRow={frameRowProps}>
                <ClassAttribute classAttribute={classAttributeProps}/>
            </FrameRow>
        );
    };

    const onInterfaceClick = (ev: React.MouseEvent) => {
        dispatch(selectNewElement(props.interface.id));
    };

    const interfacePropertiesSegment: IFrameSegmentGraphicData = {
        segmentSeparator: {
            x: frame.x,
            y: sections.properties.y,
            xLength: frame.width,
            yLength: 0
        }
    };

    const interfaceMethodsSegment: IFrameSegmentGraphicData = {
        segmentSeparator: {
            x: frame.x,
            y: sections.methods.y,
            xLength: frame.width,
            yLength: 0
        }
    };

    const interfaceProperties = props.properties.map((classProperty, index) => createNewInterfaceRow(index, classProperty, sections.properties.y));
    const interfaceMethods = props.methods.map((classMethods, index) => createNewInterfaceRow(index, classMethods, sections.methods.y));

    const frameFunctionality: IFrameFunctionality = {
        onFrameMove: () => {
            if ((event.target as SVGElement).nodeName !== 'circle') {
                dispatch(isMouseDown(true));
                dispatch(newCanvasOperation({
                    type: CanvasOperationEnum.MOVE_ELEMENT,
                    elementId: props.interface.id
                }));
                setJoints(<g/>);
            }
        },
        onFrameResize: (direction: Direction) => {
            dispatch(isMouseDown(true));
            dispatch(newCanvasOperation({
                type: direction === Direction.LEFT ? CanvasOperationEnum.RESIZE_ELEMENT_LEFT : CanvasOperationEnum.RESIZE_ELEMENT_RIGHT,
                elementId: props.interface.id
            }));
            setJoints(<g/>);
        },
        onFrameSetDefaultWidth: () => {},
        onFrameClick: onInterfaceClick,
        onFrameMouseLeave: (event: React.MouseEvent) => {
            setJoints(<g/>);
        },
        onFrameMouseOver: (event: React.MouseEvent) => {
            if (isMouseDownState) {
                setJoints(<g/>);
            } else {
                setJoints((
                    <Joints
                        coordinates={{ x: frame.x, y: frame.y }}
                        width={frame.width}
                        height={frame.height}
                        fromElementId={props.interface.id}
                    />
                ));
            }
        }
    };

    const interfaceHeadData: IInterfaceHead = {
        graphicData: {
            text: {
                x: frame.xCenter,
                y: frame.y + frame.rowHeight,
            },
            title: {
                x: frame.xCenter,
                y: frame.y + (frame.rowHeight / 2)
            }
        },
        data: {
            text: props.interface.data.elementName
        }
    };

    const framePropertiesSegment = () => {
        return props.properties.length === 0 ? <g/> : (
            <FrameSegment graphicData={interfacePropertiesSegment}>
                {...interfaceProperties}
             </FrameSegment>
        );
    };

    const frameMethodsSegment = () => {
        return props.methods.length === 0 ? <g/> : (
            <FrameSegment graphicData={interfaceMethodsSegment}>
                {...interfaceMethods}
             </FrameSegment>
        );  
    };

    return (
        <Frame graphicData={frame} functionality={frameFunctionality}>
             <FrameHead>
                 <InterfaceHead {...interfaceHeadData}/>
             </FrameHead>
             {framePropertiesSegment()}
             {frameMethodsSegment()}
             {joints}
        </Frame>
    );
};

export default Interface;