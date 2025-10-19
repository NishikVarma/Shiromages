import "../App.css";
import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import { upload } from "../features/auth/authService.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { AlertContext } from '../context/AlertContext.jsx';
import UploadProgress from "../components/uploadProgress.jsx";
import ImageModal from "../components/imageModal.jsx";

function Gallery() {
  const [images, setImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();

  const { user, logout } = useContext(AuthContext);
  const { alertMsg, showAlert } = useContext(AlertContext);

  const getAuthHeaders = useCallback(() => {
    const token = user?.token;
    if (!token) {
      navigate("/login");
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [user, navigate]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchInitialImages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/images/search?q=`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          if (res.status === 401) logout();
          throw new Error("Failed to fetch initial images");
        }
        const data = await res.json();
        setImages(data || []);
      } catch (err) {
        console.error("Initial fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialImages();
  }, [user, navigate, getAuthHeaders, logout]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/images/search?q=${searchTerm}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) {
        if (res.status === 401) logout();
        throw new Error("Failed to fetch images");
      }

      const data = await res.json();
      setImages(data || []);

      if (searchTerm.trim()) {
        showAlert(`Found ${data.length} image(s) matching "${searchTerm}".`);
      }
    } catch (err) {
      console.error("Search/Fetch failed:", err);
      showAlert("Could not load images.");
    }
  };

  const handleDelete = async (indexToDelete) => {
    const imageToDelete = images[indexToDelete];
    if (!imageToDelete) return;
    const key = imageToDelete.name;

    try {
      const res = await fetch(
        `http://localhost:5000/api/images/delete/${key}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setImages((prevImages) =>
          prevImages.filter((_, i) => i !== indexToDelete)
        );
        showAlert(`Successfully deleted image: ${imageToDelete.name}`);
      } else {
        showAlert(`Deletion failed for ${imageToDelete.name}: ${data.message}`);
      }
    } catch (err) {
      console.error("Deletion network failed:", err);
      showAlert(`Network error while trying to delete ${imageToDelete.name}.`);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const fileQueue = files.map((file) => ({ file, progress: 0 }));
    setUploadQueue(fileQueue);
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploadQueue([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    showAlert("Upload cancelled.");
  };

  const executeUpload = async () => {
    if (uploadQueue.length === 0)
      return showAlert("Please select files first.");

    setIsUploading(true);
    abortControllerRef.current = new AbortController();
    const newImages = [];
    let uploadSuccessCount = 0;

    try {
      await Promise.all(
        uploadQueue.map(async (item, index) => {
          const formData = new FormData();
          formData.append("image", item.file);
          try {
            const data = await upload(
              formData,
              user.token,
              (progress) => {
                setUploadQueue((prevQueue) => {
                  const newQueue = [...prevQueue];
                  if (newQueue[index]) {
                    newQueue[index] = { ...newQueue[index], progress };
                  }
                  return newQueue;
                });
              },
              abortControllerRef.current.signal
            );
            if (data?.url && data?.name) {
              newImages.push(data);
              uploadSuccessCount++;
            }
          } catch (err) {
            if (axios.isCancel(err)) {
              console.log("Upload cancelled by user");
            } else {
              console.error(`Upload failed for ${item.file.name}:`, err);
              showAlert(`Failed to upload ${item.file.name}`);
            }
          }
        })
      );

      if (uploadSuccessCount > 0) {
        setImages((prev) => [...prev, ...newImages]);
        showAlert(`Successfully uploaded ${uploadSuccessCount} image(s)!`);
      }
    } finally {
      setIsUploading(false);
      setUploadQueue([]);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const openImageModal = (imageUrl) => setSelectedImage(imageUrl);
  const closeImageModal = () => setSelectedImage(null);

  return (
    <div>
      {alertMsg && <div className="alert-banner">{alertMsg}</div>}

      <nav className="navbar">
        <div className="title">Shiromages</div>

        <div className="nav-buttons">
          {user ? (
            <>
              <span className="welcomeUser">Welcome, {user.name}</span>

              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn btn-secondary">Login</button>
              </Link>

              <Link to="/register">
                <button className="btn btn-secondary">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {user && (
        <>
          <div className="upload-search">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />

              <button
                onClick={() => handleSearch()}
                className="btn btn-primary"
              >
                Search
              </button>
            </div>

            <div className="upload-box">
              {/* This label acts as the new, styled "Choose Files" button. */}

              {/* Clicking it will trigger the hidden file input inside. */}

              <label className="btn btn-primary">
                Choose Files
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg, image/png"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </label>

              {/* Your existing upload button remains the same. */}

              <button
                onClick={executeUpload}
                disabled={uploadQueue.length === 0 || isUploading}
                className="btn"
              >
                {isUploading
                  ? "Uploading..."
                  : `Upload (${uploadQueue.length})`}
              </button>
            </div>
          </div>

          <UploadProgress
            uploadQueue={uploadQueue}
            isUploading={isUploading}
            onCancel={handleCancelUpload}
          />

          <div className="gallery">
            {images.map((img, index) => (
              <div
                key={img.name || index}
                className="photo-frame"
                onClick={() => openImageModal(img.url)}
              >
                <img src={img.url} alt={img.name} />

                <div className="photo-footer">
                  <p className="photo-title">{img.name}</p>

                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();

                      handleDelete(index);
                    }}
                  >
                    <svg
                      width="16px"
                      height="16px"
                      viewBox="0 0 28 28"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.8489 22.6922C11.5862 22.7201 11.3509 22.5283 11.3232 22.2638L10.4668 14.0733C10.4392 13.8089 10.6297 13.5719 10.8924 13.5441L11.368 13.4937C11.6307 13.4659 11.8661 13.6577 11.8937 13.9221L12.7501 22.1126C12.7778 22.3771 12.5873 22.614 12.3246 22.6418L11.8489 22.6922Z"
                        fill="#ffffff"
                      />

                      <path
                        d="M16.1533 22.6418C15.8906 22.614 15.7001 22.3771 15.7277 22.1126L16.5841 13.9221C16.6118 13.6577 16.8471 13.4659 17.1098 13.4937L17.5854 13.5441C17.8481 13.5719 18.0387 13.8089 18.011 14.0733L17.1546 22.2638C17.127 22.5283 16.8916 22.7201 16.6289 22.6922L16.1533 22.6418Z"
                        fill="#ffffff"
                      />

                      <path
                        clipRule="evenodd"
                        d="M11.9233 1C11.3494 1 10.8306 1.34435 10.6045 1.87545L9.54244 4.37037H4.91304C3.8565 4.37037 3 5.23264 3 6.2963V8.7037C3 9.68523 3.72934 10.4953 4.67218 10.6145L7.62934 26.2259C7.71876 26.676 8.11133 27 8.56729 27H20.3507C20.8242 27 21.2264 26.6513 21.2966 26.1799L23.4467 10.5956C24.3313 10.4262 25 9.64356 25 8.7037V6.2963C25 5.23264 24.1435 4.37037 23.087 4.37037H18.4561L17.394 1.87545C17.1679 1.34435 16.6492 1 16.0752 1H11.9233ZM16.3747 4.37037L16.0083 3.50956C15.8576 3.15549 15.5117 2.92593 15.1291 2.92593H12.8694C12.4868 2.92593 12.141 3.15549 11.9902 3.50956L11.6238 4.37037H16.3747ZM21.4694 11.0516C21.5028 10.8108 21.3154 10.5961 21.0723 10.5967L7.1143 10.6285C6.86411 10.6291 6.67585 10.8566 6.72212 11.1025L9.19806 24.259C9.28701 24.7317 9.69985 25.0741 10.1808 25.0741H18.6559C19.1552 25.0741 19.578 24.7058 19.6465 24.2113L21.4694 11.0516ZM22.1304 8.7037C22.6587 8.7037 23.087 8.27257 23.087 7.74074V7.25926C23.087 6.72743 22.6587 6.2963 22.1304 6.2963H5.86957C5.34129 6.2963 4.91304 6.72743 4.91304 7.25926V7.74074C4.91304 8.27257 5.34129 8.7037 5.86956 8.7037H22.1304Z"
                        fill="#ffffff"
                        fillRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={closeImageModal} />
      )}
    </div>
  );
}

export default Gallery;
