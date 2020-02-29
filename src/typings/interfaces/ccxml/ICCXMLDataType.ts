import ICCXMLBaseElement from './ICCXMLBaseElement';
import ICCXMLEntry from './ICCXMLEntry';

export default interface ICCXMLDataType extends ICCXMLBaseElement {
    entry: Array<ICCXMLEntry>;
}