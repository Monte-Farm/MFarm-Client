import { Viewer } from '@react-pdf-viewer/core';
import { Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import packageJson from '../../../package.json';


interface PDFViewerProps {
    fileUrl: string
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {

    const pdfjsVersion = packageJson.dependencies['pdfjs-dist'];
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    return (
        <div style={{ height: '1000px', width: '100%' }}>
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`}>
                <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]}>

                </Viewer>
            </Worker>
        </div>

    )
}


export default PDFViewer;