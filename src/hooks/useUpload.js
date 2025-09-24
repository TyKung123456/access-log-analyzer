<<<<<<< HEAD
// hooks/useUpload.js - Enhanced Version Compatible with Existing Structure
import { useState, useCallback } from 'react';
import uploadService from '../services/uploadService.js';

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResult(null);

    try {
      console.log('🚀 Starting enhanced upload for:', file.name);

      // Use the enhanced upload service
      const result = await uploadService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(result);
      console.log('✅ Upload successful:', result);
      return { success: true, ...result };

    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadResult,
    uploadError,
    handleFileUpload,
  };
=======
// hooks/useUpload.js - Fixed Import
import { useState } from 'react';
import uploadService from '../services/uploadService.js'; // Fixed: use default import

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Single file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file before upload
    const validationErrors = uploadService.validateFile(file);
    if (validationErrors.length > 0) {
      setUploadError(validationErrors.join(', '));
      return { success: false, errors: validationErrors };
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResult(null);

    try {
      console.log('🔄 Starting file upload:', file.name);
      
      // Upload file with progress tracking
      const result = await uploadService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(result);
      
      if (result.success) {
        console.log('✅ Upload successful:', result);
        return {
          success: true,
          recordCount: result.recordCount,
          message: result.message,
          data: result.data
        };
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadError(error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsUploading(false);
      // Keep progress at 100% for a moment to show completion
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  // Handle file input change event
  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const result = await handleFileUpload(file);
    
    // Clear the input value so the same file can be uploaded again
    event.target.value = '';
    
    return result;
  };

  // Multiple files upload
  const handleMultipleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResult(null);

    try {
      console.log(`🔄 Starting batch upload: ${files.length} files`);
      
      const results = await uploadService.uploadMultipleFiles(files, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(results);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      return {
        success: failCount === 0,
        totalFiles: files.length,
        successCount,
        failCount,
        results,
        message: `อัปโหลด ${successCount}/${files.length} ไฟล์สำเร็จ`
      };

    } catch (error) {
      console.error('❌ Batch upload error:', error);
      setUploadError(error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  // Get file information
  const getFileInfo = (file) => {
    return uploadService.getFileInfo(file);
  };

  // Validate file
  const validateFile = (file) => {
    return uploadService.validateFile(file);
  };

  // Check API status
  const checkAPIStatus = async () => {
    try {
      return await uploadService.checkAPIStatus();
    } catch (error) {
      console.error('API status check failed:', error);
      return false;
    }
  };

  // Get upload statistics
  const getUploadStats = async () => {
    try {
      return await uploadService.getUploadStats();
    } catch (error) {
      console.error('Failed to get upload stats:', error);
      return null;
    }
  };

  // Clear upload state
  const clearUploadState = () => {
    setUploadProgress(0);
    setUploadResult(null);
    setUploadError(null);
    setIsUploading(false);
  };

  // Drag and drop handlers
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    
    if (files.length === 1) {
      return await handleFileUpload(files[0]);
    } else if (files.length > 1) {
      return await handleMultipleFilesUpload(files);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    return uploadService.formatFileSize ? 
      uploadService.formatFileSize(bytes) : 
      `${Math.round(bytes / 1024)} KB`;
  };

  // Get progress percentage as string
  const getProgressPercentage = () => {
    return `${Math.round(uploadProgress)}%`;
  };

  // Check if upload is in progress
  const isInProgress = isUploading && uploadProgress > 0 && uploadProgress < 100;

  // Check if upload is complete
  const isComplete = uploadProgress === 100 && !isUploading;

  return {
    // State
    isUploading,
    uploadProgress,
    uploadResult,
    uploadError,
    
    // Actions
    handleFileUpload,
    handleFileInputChange,
    handleMultipleFilesUpload,
    clearUploadState,
    
    // Drag & Drop
    handleDragOver,
    handleDragLeave,
    handleDrop,
    
    // Utilities
    getFileInfo,
    validateFile,
    checkAPIStatus,
    getUploadStats,
    formatFileSize,
    getProgressPercentage,
    
    // Status helpers
    isInProgress,
    isComplete,
    hasError: !!uploadError,
    hasResult: !!uploadResult
  };
>>>>>>> dccf88c7 (update case)
};