import React, { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

interface FileUploaderProps {
  acceptedFileTypes?: string[];
  onFileUpload?: (file: File) => void;
  maxFiles?: number
  imageSrc?: string
}

const FileUploader: React.FC<FileUploaderProps> = ({
  acceptedFileTypes = ['image/*'],
  onFileUpload,
  maxFiles,
  imageSrc
}) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = async (file: File) => {
    if (onFileUpload) {
      await onFileUpload(file);
    }
  };
  
  return (
    <div className="file-uploader">
      <FilePond
        files={files}
        onupdatefiles={(fileItems) => {
          const updatedFiles = fileItems.map((fileItem) => fileItem.file as File);
          setFiles(updatedFiles);
        }}
        onaddfile={(error, fileItem) => {
          if (error) {
            console.error('Error al agregar archivo:', error);
            return;
          }

          const file = fileItem.file as File;
          handleFileUpload(file);
        }}
        allowMultiple={true}
        maxFiles={maxFiles}
        name="files"
        acceptedFileTypes={acceptedFileTypes}
        labelIdle='Arrastra tus archivos o <span class="filepond--label-action">explora</span>'
      >
      </FilePond>
    </div>
  );
};  
export default FileUploader;
