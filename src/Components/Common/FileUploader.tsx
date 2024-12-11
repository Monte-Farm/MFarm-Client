import React, { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

interface FileUploaderProps {
  serverUrl?: string;
  acceptedFileTypes?: string[];
  onFileUpload?: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  serverUrl = '/upload',
  acceptedFileTypes = ['image/*'],
  onFileUpload,
}) => {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="file-uploader">
      <FilePond
        files={files}
        onupdatefiles={(fileItems) => {

          const updatedFiles = fileItems.map((fileItem) => fileItem.file as File);
          setFiles(updatedFiles);
          if (onFileUpload) {
            updatedFiles.forEach(onFileUpload);
          }
        }}
        allowMultiple={true}
        maxFiles={5}
        server={serverUrl}
        name="files"
        acceptedFileTypes={acceptedFileTypes}
        labelIdle='Arrastra tus archivos o <span class="filepond--label-action">explora</span>'
      />
    </div>
  );
};

export default FileUploader;
