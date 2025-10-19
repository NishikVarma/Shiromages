import React from 'react';

function UploadProgress({ uploadQueue, isUploading, onCancel }) {
  if (uploadQueue.length === 0) {
    return null;
  }

  const totalProgress = uploadQueue.reduce((sum, item) => sum + item.progress, 0);
  const overallPercentage = Math.round(totalProgress / uploadQueue.length);

  return (
    <div className="progress-list">
      <div className="progress-header">
        <h4>
          {isUploading
            ? `Uploading ${uploadQueue.length} files...`
            : `Ready to upload ${uploadQueue.length} files. Click 'Upload' to start.`}
        </h4>
        <button onClick={onCancel} className="cancel-btn">×</button>
      </div>
      <div className="progress-item">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${overallPercentage}%` }}
          ></div>
        </div>
        <span className="progress-item-percent">{overallPercentage}%</span>
      </div>
    </div>
  );
}

export default UploadProgress;
