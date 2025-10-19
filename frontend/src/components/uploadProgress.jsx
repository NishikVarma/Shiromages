import React from 'react';

function UploadProgress({ uploadQueue, isUploading, onCancel }) {
  if (uploadQueue.length === 0) return null;

  // Styles
  const styles = {
    progressList: {
      marginBottom: '30px',
      border: '1px solid #f0f0f0',
      padding: '15px',
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
    },
    headerText: {
      margin: 0,
      color: '#555',
      fontWeight: 500,
      fontSize: '0.95rem',
    },
    cancelBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      lineHeight: 1,
      color: '#888',
      cursor: 'pointer',
      padding: '0 5px',
    },
    progressItem: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '10px',
    },
    progressBar: {
      flexGrow: 1,
      height: '8px',
      backgroundColor: '#e0e0e0',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      transition: 'width 0.3s ease',
    },
    progressPercent: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: '#555',
      width: '40px',
      textAlign: 'right',
    },
    progressName: {
      fontSize: '0.9rem',
      color: '#555',
    },
  };

  // Function to determine fill color based on status
  const getFillColor = (status) => {
    switch (status) {
      case 'done':
        return '#4caf50';
      case 'processing':
        return '#ffc107';
      default:
        return '#4285F4';
    }
  };

  return (
    <div style={styles.progressList}>
      <div style={styles.progressHeader}>
        <h4 style={styles.headerText}>
          {isUploading
            ? `Uploading and processing ${uploadQueue.length} files...`
            : `Ready to upload ${uploadQueue.length} files. Click 'Upload' to start.`}
        </h4>
        <button onClick={onCancel} style={styles.cancelBtn}>
          ×
        </button>
      </div>

      {uploadQueue.map((item, idx) => {
        let fillWidth = 0;
        if (item.status === 'done') fillWidth = 100;
        else if (item.status === 'processing') fillWidth = 90;
        else fillWidth = item.progress || 0;

        return (
          <div style={styles.progressItem} key={idx}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${fillWidth}%`,
                  backgroundColor: getFillColor(item.status),
                }}
              ></div>
            </div>
            <span style={styles.progressPercent}>
              {item.status === 'done'
                ? 'Done'
                : item.status === 'processing'
                ? 'Processing...'
                : `${item.progress || 0}%`}
            </span>
            <span style={styles.progressName}>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default UploadProgress;
