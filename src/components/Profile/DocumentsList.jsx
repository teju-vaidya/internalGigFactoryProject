import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  FileText,
  Edit2,
  Trash2,
  Download,
  ExternalLink,
  X,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { toast } from "react-toastify";

export const DocumentsList = ({
  isGigExpert,
  resumeUrl,
  portfolioPdfUrl,
  verifications,
  documents = [],
  onUpload,
  onDelete,
  onRename,
  isAdmin = false,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const toggleMenu = (docId) => {
    setActiveMenuId((prev) => (prev === docId ? null : docId));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".doc-menu-container")) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showUploadModal || showRenameModal || showDeleteModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showUploadModal, showRenameModal, showDeleteModal]);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const nameWithoutExt =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setDocName(nameWithoutExt);
    }
  };

  // Rename form state
  const [renamingDoc, setRenamingDoc] = useState(null);
  const [newDocName, setNewDocName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const numBytes = Number(bytes);
    if (isNaN(numBytes)) return "N/A";
    if (numBytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const nameWithoutExt =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setDocName(nameWithoutExt);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentName", docName.trim());

      const success = await onUpload(formData);
      if (success) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setDocName("");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRenameClick = (doc) => {
    setRenamingDoc(doc);
    setNewDocName(doc.file_name);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      toast.error("Document name cannot be empty.");
      return;
    }

    setIsRenaming(true);
    try {
      const success = await onRename(renamingDoc.id, newDocName.trim());
      if (success) {
        setShowRenameModal(false);
        setRenamingDoc(null);
        setNewDocName("");
      }
    } catch (err) {
      toast.error(err.message || "Failed to rename document.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteClick = (doc) => {
    setDeleteDocTarget(doc);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteDocTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteDocTarget.id);
      setShowDeleteModal(false);
      setDeleteDocTarget(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete document.");
    } finally {
      setIsDeleting(false);
    }
  };

  const combinedDocuments = [...documents];

  if (
    isGigExpert &&
    resumeUrl &&
    !documents.some((doc) => doc.file_url === resumeUrl)
  ) {
    combinedDocuments.push({
      id: "legacy-resume",
      file_name: "Portfolio URL (Primary)",
      file_url: resumeUrl,
      file_size: 0,
      created_at: new Date().toISOString(),
      isLegacy: true,
      legacyType: "resume",
      canDelete: false,
      canupdate: false,
      canDownload: false,
    });
  }

  if (
    portfolioPdfUrl &&
    !documents.some((doc) => doc.file_url === portfolioPdfUrl)
  ) {
    combinedDocuments.push({
      id: "legacy-portfolio",
      file_name: "Portfolio (PDF)",
      file_url: portfolioPdfUrl,
      file_size: 0,
      created_at: new Date().toISOString(),
      isLegacy: true,
      legacyType: "portfolio",
      canDelete: false,
      canupdate: false,
    });
  }

  return (
    <div className="pane-content-card">
      <div className="card-header-flex-row">
        <h3>
          {isAdmin
            ? "Professional  Documents"
            : isGigExpert
              ? "Professional  Documents"
              : "Professional  Documents"}
        </h3>
        {!isAdmin && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="add-document-action-trigger"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {/* Information Tip regarding what to upload */}
      {!isAdmin && (
        <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-3 mt-3">
          <p className="text-[#8a8f98] text-[0.74rem] leading-relaxed m-0">
            💡 <strong>Upload Portfolio, Work Samples, or CV:</strong> You can
            upload your portfolio PDF, sample files, certifications, work
            history proof, or other showcase documents here. Complete uploads
            will directly boost your profile completion score!
          </p>
        </div>
      )}

      {/* Main Documents List */}
      <div className="flex flex-col gap-4 mt-4">
        {/* Unified Documents List */}
        {combinedDocuments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {combinedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between bg-[#0c0c0e] border border-[#23232a] rounded p-3 transition-colors hover:border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="bg-[#1c1c22] p-2 rounded text-[#70d64d] flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.85rem] font-semibold text-white truncate m-0 mb-0.5">
                      {doc.file_name}
                    </p>
                    <p className="text-[0.7rem] text-[#6c727f] m-0">
                      {formatFileSize(doc.file_size)} •{" "}
                      {new Date(
                        doc.created_at || doc.uploaded_at,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Desktop view actions */}
                <div className="hidden md:flex items-center gap-2 ml-3">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#8a8f98] hover:text-white bg-transparent border-none cursor-pointer transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink size={14} />
                  </a>
                  {doc.canDownload ?? (
                    <a
                      href={doc.file_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[#8a8f98] hover:text-white bg-transparent border-none cursor-pointer transition-colors"
                      title="Download Document"
                    >
                      <Download size={14} />
                    </a>
                  )}

                  {!isAdmin && (
                    <>
                      {(!doc.isLegacy && doc.canupdate) ?? (
                        <button
                          type="button"
                          onClick={() => handleRenameClick(doc)}
                          className="p-1.5 text-[#8a8f98] hover:text-[#b5ff14] bg-transparent border-none cursor-pointer transition-colors"
                          title="Rename Document"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {doc.canDelete ?? (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(doc)}
                          className="p-1.5 text-[#8a8f98] hover:text-[#ef4444] bg-transparent border-none cursor-pointer transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Mobile view action: 3-dot dropdown menu */}
                <div className="md:hidden block relative doc-menu-container ml-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(doc.id);
                    }}
                    className="p-2 text-[#8a8f98] hover:text-white bg-transparent border-none cursor-pointer transition-colors flex items-center justify-center"
                    title="Actions"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {activeMenuId === doc.id && (
                    <div className="absolute right-0 top-8 bg-[#121215] border border-[#23232a] rounded-lg shadow-xl py-1.5 w-40 z-[100] animate-fade-in">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2 text-[0.82rem] text-[#8a8f98] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setActiveMenuId(null)}
                      >
                        <ExternalLink size={14} /> Open
                      </a>
                      {doc.canDownload ?? (
                        <a
                          href={doc.file_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-3 py-2 text-[0.82rem] text-[#8a8f98] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Download size={14} /> Download
                        </a>
                      )}

                      {!isAdmin && (
                        <>
                          <div className="h-[1px] bg-white/5 my-1" />
                          {!doc.isLegacy && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleRenameClick(doc);
                              }}
                              className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-[0.82rem] text-[#8a8f98] hover:text-[#b5ff14] hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer"
                            >
                              <Edit2 size={14} /> Rename
                            </button>
                          )}
                          {doc.canDelete ?? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleDeleteClick(doc);
                              }}
                              className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-[0.82rem] text-[#ef4444] hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !isGigExpert && verifications && verifications.length > 0 ? (
          <div className="empty-documents-status-placeholder text-left flex flex-col gap-2">
            {verifications.map((v) => (
              <div
                key={v.id}
                className="flex justify-between border-b border-white/5 pb-1.5"
              >
                <span className="text-[0.85rem] text-white">
                  {v.document_type}
                </span>
                <span
                  className={`text-[0.75rem] ${v.verification_status === "verified" ? "text-[#70d64d]" : "text-[#f59e0b]"}`}
                >
                  {v.verification_status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-documents-status-placeholder">
            <p className="primary-empty-msg">No documents uploaded yet</p>
            <p className="secondary-empty-msg text-gray-500">
              {isAdmin
                ? "No additional documents have been uploaded to this profile."
                : isGigExpert
                  ? "Upload certifications, ID proofs, or project reports files."
                  : "Upload verification NDAs, MSAs, or W9 tax files here."}
            </p>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal &&
        createPortal(
          <div className="profile-modal-overlay">
            <div
              className="profile-modal-card max-w-[450px]"
              style={{ height: "80vh" }}
            >
              <div className="profile-modal-header">
                <h2>Upload Professional Document</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setDocName("");
                  }}
                  className="profile-modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleUploadSubmit}
                className="profile-modal-form"
              >
                <div className="profile-modal-scroll-area">
                  <div className="form-group">
                    <label>Select Document File</label>
                    <div
                      className={`dropzone-container border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                        isDragActive
                          ? "border-[#b5ff14] bg-[#b5ff14]/5"
                          : "border-[#23232a] bg-[#1c1c22] hover:border-white/20"
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={32} className="text-[#b5ff14]" />
                          <span className="text-[0.85rem] font-bold text-white max-w-[280px] truncate">
                            {selectedFile.name}
                          </span>
                          <span className="text-[0.7rem] text-[#6c727f]">
                            {formatFileSize(selectedFile.size)}
                          </span>
                          <button
                            type="button"
                            className="mt-2 text-[0.75rem] text-[#b5ff14] hover:underline bg-transparent border-none cursor-pointer font-bold"
                          >
                            Click to replace file
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[#8a8f98]">
                          <Plus size={32} strokeWidth={1.5} />
                          <span className="text-[0.85rem] font-medium text-white">
                            Drag &amp; drop your file here, or{" "}
                            <span className="text-[#b5ff14] font-semibold hover:underline">
                              browse
                            </span>
                          </span>
                          <span className="text-[0.7rem] text-gray-500">
                            Supported: PDF, Word, Images, Zip, Excel up to 20MB.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Document Display Name</label>
                    <input
                      type="text"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="e.g. Identity Proof, ISO Certification"
                      required
                    />
                  </div>
                </div>

                <div className="profile-modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setDocName("");
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="btn-save flex items-center gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />{" "}
                        Uploading...
                      </>
                    ) : (
                      "Upload Document"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Rename Document Modal */}
      {showRenameModal &&
        createPortal(
          <div className="profile-modal-overlay">
            <div
              className="profile-modal-card max-w-[450px]"
              style={{ height: "80vh" }}
            >
              <div className="profile-modal-header">
                <h2>Rename Document</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameModal(false);
                    setRenamingDoc(null);
                    setNewDocName("");
                  }}
                  className="profile-modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleRenameSubmit}
                className="profile-modal-form"
              >
                <div className="profile-modal-scroll-area">
                  <div className="form-group">
                    <label>Document Name</label>
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="profile-modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRenameModal(false);
                      setRenamingDoc(null);
                      setNewDocName("");
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRenaming}
                    className="btn-save flex items-center gap-1.5"
                  >
                    {isRenaming ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal &&
        deleteDocTarget &&
        createPortal(
          <div className="profile-modal-overlay">
            <div className="profile-modal-card max-w-[400px]">
              <div className="profile-modal-header border-none pb-0">
                <h2>Confirm Deletion</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteDocTarget(null);
                  }}
                  className="profile-modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDeleteSubmit();
                }}
                className="profile-modal-form"
              >
                <div
                  className="profile-modal-scroll-area"
                  style={{ maxHeight: "none", overflowY: "visible" }}
                >
                  <p className="text-gray-300 text-[0.88rem] leading-relaxed mb-6">
                    Are you sure you want to delete the document{" "}
                    <strong>"{deleteDocTarget.file_name}"</strong>? This action
                    cannot be undone.
                  </p>
                </div>

                <div className="profile-modal-footer border-none pt-0 gap-3 justify-end flex">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteDocTarget(null);
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white border-none rounded-md px-4 py-[10px] text-[0.88rem] font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />{" "}
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
